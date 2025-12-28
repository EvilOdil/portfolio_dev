from PIL import Image
import os

# --- Configuration ---
IMAGE_PATH = "assets/odil.jpeg"
OUTPUT_FILE = "assets/odil_terminal_transparent.html"

# 120 is a good balance for a standard 1080p monitor web view
WIDTH = 120  

# Classic "Dense" Character Map (Dark -> Light)
ASCII_CHARS = ["@", "#", "S", "%", "?", "*", "+", ";", ":", ",", "."]

def resize_image(image, new_width=100):
    width, height = image.size
    ratio = height / width
    # 0.55 correction factor for rectangular terminal characters
    new_height = int(new_width * ratio * 0.55)
    return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

def grayify(image):
    return image.convert("L")

def pixels_to_ascii(image):
    pixels = image.getdata()
    max_index = len(ASCII_CHARS) - 1
    
    # Map grayscale (0-255) to character index
    characters = "".join([ASCII_CHARS[int(pixel * max_index / 255)] for pixel in pixels])
    return characters

def generate_html(image_path, output_path, new_width=100):
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found.")
        return

    try:
        image = Image.open(image_path)
    except Exception as e:
        print(f"Error opening image: {e}")
        return

    # Process Image
    new_image_data = pixels_to_ascii(grayify(resize_image(image, new_width)))
    
    # Break into lines
    pixel_count = len(new_image_data)
    ascii_str = "\n".join(new_image_data[i:(i+new_width)] for i in range(0, pixel_count, new_width))

    # CSS for that Matrix/Linux Terminal Vibe
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Terminal View Transparent</title>
        <style>
            body {{
                /* CHANGED: Background is now transparent */
                background-color: transparent; 
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
            }}
            pre {{
                font-family: 'Courier New', 'Lucida Console', monospace;
                font-size: 11px; 
                line-height: 11px; 
                
                /* THE CLASSIC TERMINAL LOOK */
                color: #00ff00;            /* Bright Green */
                text-shadow: 0 0 4px #008f11; /* Phosphor Glow */
                
                white-space: pre;
                font-weight: bold;
            }}
        </style>
    </head>
    <body>
        <pre>{ascii_str}</pre>
    </body>
    </html>
    """

    with open(output_path, "w") as f:
        f.write(html_content)
    
    print(f"Transparent terminal render generated: {output_path}")

if __name__ == "__main__":
    generate_html(IMAGE_PATH, OUTPUT_FILE, WIDTH)