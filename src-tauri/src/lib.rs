// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::fs;
use std::path::Path;

use id3::frame::Content;
use id3::frame::Frame;
use id3::frame::Picture;
use id3::frame::PictureType;
use id3::{Tag, Version};

#[tauri::command]
fn write_file(name: String, content: Vec<u8>) -> Result<String, String> {
    match fs::write(&name, content) {
        Ok(_) => Ok(format!("File written successfully to {}", name)),
        Err(e) => Err(format!("Failed to write file: {}", e)),
    }
}

#[tauri::command]
fn ensure_directory_exists(dir_path: String) -> Result<String, String> {
    let path = Path::new(&dir_path);

    //Attempt to create the directories if they don't exist
    if let Err(e) = fs::create_dir_all(path) {
        return Err(format!("Failed to create directories: {}", e));
    }

    Ok(format!("Directories ensured for path: {}", dir_path))
}

#[tauri::command]
fn delete_path(target_path: String) -> Result<String, String> {
    let path = Path::new(&target_path);

    if !path.exists() {
        return Ok(format!("Path does not exist. Nothing to do"));
    }

    //Attempt to remove file or directory
    if path.is_file() {
        fs::remove_file(path).map_err(|e| format!("Failed to delete file: {}", e))?;
    } else if path.is_dir() {
        fs::remove_dir_all(path).map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        return Err(format!("Unknown path type: {}", target_path));
    }

    return Ok(format!("Successfully deleted: {}", target_path));
}

#[tauri::command]
fn add_image_to_mp3(mp3_path: String, image_path: String) -> Result<String, String> {
    // Load the MP3 file's ID3 tag or create a new one if it doesn't exist
    let mut tag = Tag::read_from_path(&mp3_path).unwrap_or_else(|_| Tag::new());

    // Read the image data
    let image_data =
        fs::read(&image_path).map_err(|e| format!("Failed to read image file: {}", e))?;

    // Create a Picture frame for the image
    let picture = Picture {
        mime_type: "image/jpeg".to_string(), // Or "image/png" depending on your image format
        picture_type: PictureType::CoverFront, // This indicates it's a front cover
        description: String::from("Cover Art"), // Optional description
        data: image_data,                    // The image data
    };

    // Convert Picture to Frame
    let frame = Frame::with_content("APIC", Content::Picture(picture));

    // Add the picture frame to the tag
    tag.add_frame(frame);

    // Write the updated tag back to the MP3 file
    tag.write_to_path(&mp3_path, Version::Id3v24)
        .map_err(|e| format!("Failed to write ID3 tag: {}", e))?;

    Ok(format!("Successfully added image to MP3 at {}", mp3_path))
}

// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            add_image_to_mp3,
            ensure_directory_exists,
            delete_path,
            write_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
