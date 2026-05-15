mod serial;

use serial::{connect, disconnect, list_ports, send_command, start_monitor};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let serial_state = serial::make_shared();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(serial_state)
        .invoke_handler(tauri::generate_handler![
            list_ports,
            connect,
            disconnect,
            send_command,
            start_monitor,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
