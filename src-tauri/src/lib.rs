// src-tauri/src/lib.rs

use todoist_api::{
    models::{CreateTaskArgs, Section, Task, UpdateTaskArgs},
    TodoistWrapper,
};

// ==========================================
// TODOIST API COMMANDS
// ==========================================

#[tauri::command]
async fn get_todoist_tasks(token: String) -> Result<Vec<Task>, String> {
    let todoist = TodoistWrapper::new(token);
    let response = todoist
        .get_tasks(None, None)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(response.results)
}

#[tauri::command]
async fn get_todoist_sections(token: String) -> Result<Vec<Section>, String> {
    let todoist = TodoistWrapper::new(token);
    let response = todoist
        .get_sections(None, None)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(response.results)
}

#[tauri::command]
async fn add_todoist_task(
    token: String,
    content: String,
    description: String,
    priority: i32,
    due_string: Option<String>,
    category: String,
) -> Result<Task, String> {
    let todoist = TodoistWrapper::new(token.clone());
    
    let mut section_id = None;
    
    if let Ok(sections_resp) = todoist.get_sections(None, None).await {
        if let Some(section) = sections_resp.results.into_iter().find(|s| s.name.eq_ignore_ascii_case(&category)) {
            section_id = Some(section.id);
        }
    }

    let args = CreateTaskArgs {
        content,
        description: Some(description),
        priority: Some(priority),
        due_string,
        section_id,
        ..Default::default()
    };

    let task = todoist.create_task(&args).await.map_err(|e| e.to_string())?;
    Ok(task)
}

#[tauri::command]
async fn close_todoist_task(token: String, id: String) -> Result<(), String> {
    let todoist = TodoistWrapper::new(token);
    todoist.complete_task(&id).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn reopen_todoist_task(token: String, id: String) -> Result<(), String> {
    let todoist = TodoistWrapper::new(token);
    todoist.reopen_task(&id).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn delete_todoist_task(token: String, id: String) -> Result<(), String> {
    let todoist = TodoistWrapper::new(token);
    todoist.delete_task(&id).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn update_todoist_task(token: String, id: String, description: String) -> Result<Task, String> {
    let todoist = TodoistWrapper::new(token);
    let args = UpdateTaskArgs {
        description: Some(description),
        ..Default::default()
    };
    
    let task = todoist.update_task(&id, &args).await.map_err(|e| e.to_string())?;
    Ok(task)
}

// ==========================================
// MEDIA LIBRARY COMMANDS
// ==========================================
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
            // FIX: Prioritize m4a (AAC) audio which HLS.js plays perfectly
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

// ==========================================
// APP ENTRY POINT (REGISTER EVERYTHING)
// ==========================================
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Todoist API Commands
            get_todoist_tasks,
            get_todoist_sections,
            add_todoist_task,
            close_todoist_task,
            reopen_todoist_task,
            delete_todoist_task,
            update_todoist_task,
            
            // Media Library Commands (namespaced with `commands::`)
            commands::get_library,
            commands::add_to_library,
            commands::remove_from_library,
            commands::clear_library,
            commands::get_youtube_stream_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}