import subprocess
import sys
import os
import shutil

def find_ghostscript():
    """
    Finds the Ghostscript executable on the system.
    Scans system PATH and common installation directories on Windows, macOS, and Linux.
    """
    # 1. Check system PATH first
    executables = ['gswin64c', 'gswin32c', 'gs']
    for exe in executables:
        if shutil.which(exe):
            return exe
            
    # 2. Check common Windows installation folders
    if os.name == 'nt':
        common_paths = [
            r"C:\Program Files\gs",
            r"C:\Program Files (x86)\gs",
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\gs"),
        ]
        for base in common_paths:
            if os.path.exists(base):
                for sub in os.listdir(base):
                    bin_dir = os.path.join(base, sub, 'bin')
                    if os.path.exists(bin_dir):
                        for exe in ['gswin64c.exe', 'gswin32c.exe', 'gs.exe']:
                            full_path = os.path.join(bin_dir, exe)
                            if os.path.exists(full_path):
                                return full_path
                                
    # 3. Check common macOS paths (Homebrew)
    elif sys.platform == 'darwin':
        brew_gs = '/opt/homebrew/bin/gs'
        if os.path.exists(brew_gs):
            return brew_gs
            
    return None

def compress_pdf(input_pdf, output_pdf, quality='ebook'):
    """
    Compresses a PDF using Ghostscript.
    quality: 'screen' (72 dpi), 'ebook' (150 dpi), 'printer' (300 dpi), 'prepress' (high fidelity)
    """
    if not os.path.exists(input_pdf):
        print(f"Error: Input file not found: {input_pdf}")
        return False
        
    gs_exe = find_ghostscript()
    if not gs_exe:
        print("Error: Ghostscript executable not found on your system.")
        print("Please verify your installation, or add Ghostscript to your environment PATH.")
        return False
        
    # Prevent overwriting input directly (Ghostscript crashes if input == output)
    same_file = os.path.abspath(input_pdf) == os.path.abspath(output_pdf)
    temp_output = output_pdf
    if same_file:
        temp_output = input_pdf + ".tmp"
        
    gs_command = [
        gs_exe,
        '-sDEVICE=pdfwrite',
        f'-dPDFSETTINGS=/{quality}',
        '-dCompatibilityLevel=1.4',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        f'-sOutputFile={temp_output}',
        input_pdf
    ]
    
    try:
        # Run command and capture standard error output
        subprocess.run(gs_command, check=True, capture_output=True)
        
        original_size = os.path.getsize(input_pdf)
        compressed_size = os.path.getsize(temp_output)
        
        if same_file:
            os.replace(temp_output, output_pdf)
            
        orig_mb = original_size / (1024 * 1024)
        comp_mb = compressed_size / (1024 * 1024)
        reduction = (1 - compressed_size / original_size) * 100 if original_size > 0 else 0
        
        print(f"Success! Compressed file saved to: {output_pdf}")
        print(f"Original Size: {orig_mb:.2f} MB")
        print(f"Compressed Size: {comp_mb:.2f} MB")
        print(f"Space Saved: {reduction:.1f}%")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Ghostscript error: {e.stderr.decode(errors='replace')}")
        if same_file and os.path.exists(temp_output):
            os.remove(temp_output)
        return False
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        if same_file and os.path.exists(temp_output):
            os.remove(temp_output)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python compress_pdf.py input.pdf [output.pdf] [quality]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else f"compressed_{os.path.basename(input_file)}"
    quality = sys.argv[3] if len(sys.argv) > 3 else 'ebook'
    
    compress_pdf(input_file, output_file, quality)