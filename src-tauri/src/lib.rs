// src-tauri/src/lib.rs

pub mod commands {
    use serde::{Deserialize, Serialize};
    use std::fs;
    use std::path::PathBuf;
    use tauri::{AppHandle, Manager};

    #[derive(Serialize, Deserialize, Clone)]
    pub struct MediaItem {
        pub id: String,
        pub name: String,
        pub url: String,
        pub category: String,
    }

    fn get_db_path(app_handle: &AppHandle) -> PathBuf {
        let dir = app_handle.path().app_local_data_dir().unwrap();
        if !dir.exists() {
            fs::create_dir_all(&dir).unwrap();
        }
        dir.join("library.json")
    }

    #[tauri::command]
    pub async fn get_library(app_handle: AppHandle) -> Result<Vec<MediaItem>, String> {
        let path = get_db_path(&app_handle);
        if !path.exists() {
            return Ok(Vec::new());
        }
        let data = fs::read_to_string(path).map_err(|e| e.to_string())?;
        let library: Vec<MediaItem> = serde_json::from_str(&data).unwrap_or_else(|_| Vec::new());
        Ok(library)
    }

    #[tauri::command]
    pub async fn add_to_library(app_handle: AppHandle, item: MediaItem) -> Result<(), String> {
        let mut library = get_library(app_handle.clone()).await?;
        if !library.iter().any(|i| i.id == item.id) {
            library.push(item);
            let path = get_db_path(&app_handle);
            let json = serde_json::to_string_pretty(&library).map_err(|e| e.to_string())?;
            fs::write(path, json).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    #[tauri::command]
    pub async fn remove_from_library(app_handle: AppHandle, id: String) -> Result<(), String> {
        let mut library = get_library(app_handle.clone()).await?;
        library.retain(|i| i.id != id);
        let path = get_db_path(&app_handle);
        let json = serde_json::to_string_pretty(&library).map_err(|e| e.to_string())?;
        fs::write(path, json).map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub async fn clear_library(app_handle: AppHandle) -> Result<(), String> {
        let path = get_db_path(&app_handle);
        if path.exists() {
            fs::remove_file(path).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    #[tauri::command]
    pub async fn get_youtube_stream_url(url: String) -> Result<String, String> {
        let output = std::process::Command::new("yt-dlp")
            .arg("-f").arg("bestaudio[ext=m4a]/bestaudio/ba/b") 
            .arg("--no-playlist")
            .arg("-g") 
            .arg(&url)
            .output()
            .map_err(|e| format!("Failed to execute yt-dlp: {}", e))?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stream_url = stdout.lines().next().unwrap_or("").trim().to_string();
            if stream_url.is_empty() { return Err("Empty stream URL".to_string()); }
            Ok(stream_url)
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("yt-dlp error: {}", stderr))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_library,
            commands::add_to_library,
            commands::remove_from_library,
            commands::clear_library,
            commands::get_youtube_stream_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}