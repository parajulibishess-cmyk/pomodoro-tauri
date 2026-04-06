// src-tauri/src/lib.rs
use todoist_api::{
    models::{CreateTaskArgs, Section, Task, UpdateTaskArgs},
    TodoistWrapper,
};

#[tauri::command]
async fn get_todoist_tasks(token: String) -> Result<Vec<Task>, String> {
    let todoist = TodoistWrapper::new(token);
    let response = todoist
        .get_tasks(None, None)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(response.results)
}

// NEW: Command to fetch user's sections
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
    category: String, // <-- NEW: We pass the category explicitly
) -> Result<Task, String> {
    let todoist = TodoistWrapper::new(token.clone());
    
    let mut section_id = None;
    
    // Look up the native Section ID using the exact category string
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_todoist_tasks,
            get_todoist_sections, // Registered new command
            add_todoist_task,
            close_todoist_task,
            reopen_todoist_task,
            delete_todoist_task,
            update_todoist_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}