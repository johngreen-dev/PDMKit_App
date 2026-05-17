use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use serialport::SerialPortInfo;
use std::io::{BufRead, BufReader, Write};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PortInfo {
    pub name: String,
    pub is_pdmkit: bool,
}

pub struct SerialState {
    pub port: Option<Box<dyn serialport::SerialPort>>,
}

impl SerialState {
    pub fn new() -> Self {
        SerialState { port: None }
    }
}

pub type SharedSerial = Arc<Mutex<SerialState>>;

pub fn make_shared() -> SharedSerial {
    Arc::new(Mutex::new(SerialState::new()))
}

#[tauri::command]
pub fn list_ports() -> Result<Vec<PortInfo>, String> {
    let ports = serialport::available_ports().map_err(|e| e.to_string())?;
    Ok(ports
        .iter()
        .map(|p| PortInfo {
            name: p.port_name.clone(),
            is_pdmkit: is_pdmkit_port(p),
        })
        .collect())
}

fn is_pdmkit_port(info: &SerialPortInfo) -> bool {
    if let serialport::SerialPortType::UsbPort(usb) = &info.port_type {
        usb.vid == 0x303A && usb.pid == 0x1002
    } else {
        false
    }
}

#[tauri::command]
pub fn connect(state: tauri::State<SharedSerial>, port_name: String) -> Result<(), String> {
    let mut s = state.lock();
    if s.port.is_some() {
        return Err("Already connected".into());
    }
    let port = serialport::new(&port_name, 115200)
        .timeout(Duration::from_millis(2000))
        .open()
        .map_err(|e| e.to_string())?;
    s.port = Some(port);
    Ok(())
}

#[tauri::command]
pub fn disconnect(state: tauri::State<SharedSerial>) -> Result<(), String> {
    let mut s = state.lock();
    s.port = None;
    Ok(())
}

/// Send a single RS_ command and read lines until a terminal response.
/// Returns all response lines.
#[tauri::command]
pub fn send_command(
    state: tauri::State<SharedSerial>,
    command: String,
) -> Result<Vec<String>, String> {
    let mut s = state.lock();
    let port = s.port.as_mut().ok_or("Not connected")?;

    let cmd = format!("{}\n", command.trim());
    port.write_all(cmd.as_bytes()).map_err(|e| e.to_string())?;
    port.flush().map_err(|e| e.to_string())?;
    let mut reader = BufReader::new(port.try_clone().map_err(|e| e.to_string())?);

    let mut lines: Vec<String> = Vec::new();
    loop {
        let mut line = String::new();
        match reader.read_line(&mut line) {
            Ok(0) => break,
            Ok(_) => {
                let trimmed = line.trim().to_string();
                if trimmed.is_empty() {
                    continue;
                }
                let done = is_terminal_response(&trimmed);
                lines.push(trimmed);
                if done {
                    break;
                }
            }
            Err(e) if e.kind() == std::io::ErrorKind::TimedOut => break,
            Err(e) => return Err(e.to_string()),
        }
    }
    Ok(lines)
}

/// Emit monitor data continuously from a background thread.
#[tauri::command]
pub fn start_monitor(
    app: AppHandle,
    state: tauri::State<SharedSerial>,
) -> Result<(), String> {
    let port = {
        let s = state.lock();
        s.port
            .as_ref()
            .ok_or("Not connected")?
            .try_clone()
            .map_err(|e| e.to_string())?
    };
    std::thread::spawn(move || {
        let mut reader = BufReader::new(port);
        loop {
            let mut line = String::new();
            match reader.read_line(&mut line) {
                Ok(0) | Err(_) => break,
                Ok(_) => {
                    let trimmed = line.trim().to_string();
                    if !trimmed.is_empty() {
                        let _ = app.emit("monitor-line", trimmed);
                    }
                }
            }
        }
    });
    Ok(())
}

fn is_terminal_response(line: &str) -> bool {
    line.starts_with("OK_")
        || line.starts_with("ERR_")
        || line == "PINS_END"
        || line == "RULES_END"
        || line == "VARS_END"
        || line == "GROUPS_END"
        || line == "STORAGE_END"
        || line == "BOARD_PINS_END"
}
