import os

# Set the folder path where images are stored
folder_path = "./"

# Get all image files
images = [f for f in os.listdir(folder_path) if f.endswith((".png", ".jpg", ".jpeg"))]

# Sort images to maintain order
images.sort()

# Rename images sequentially
for index, image in enumerate(images, start=1):
    ext = os.path.splitext(image)[1]  # Get file extension
    new_name = f"{index}{ext}"
    old_path = os.path.join(folder_path, image)
    new_path = os.path.join(folder_path, new_name)
    
    os.rename(old_path, new_path)
    print(f"Renamed: {image} -> {new_name}")

print("Renaming completed!")
