declare global {
  interface Window {
    loadPyodide: any;
    pyodide: any;
  }
}

let pyodideInstance: any = null;
let micropip: any = null;
let isLoading = false;

export const initPyodide = async () => {
  if (pyodideInstance) return pyodideInstance;
  if (isLoading) return null; // Prevent double init
  
  isLoading = true;
  try {
    console.log("Initializing Pyodide...");
    pyodideInstance = await window.loadPyodide();
    
    // Load micropip for package management
    await pyodideInstance.loadPackage("micropip");
    micropip = pyodideInstance.pyimport("micropip");
    
    // Pre-load common scientific packages
    // Removed 'feedparser' and 'arxiv' attempts as they lack pure python wheels for Pyodide
    await pyodideInstance.loadPackage(["numpy", "pandas", "matplotlib", "scipy"]);

    console.log("Pyodide Ready");
    return pyodideInstance;
  } catch (err) {
    console.error("Failed to load Pyodide", err);
    throw err;
  } finally {
    isLoading = false;
  }
};

export const runPythonCode = async (code: string): Promise<{ output: string; error?: string; results?: any }> => {
  if (!pyodideInstance) {
    await initPyodide();
  }

  try {
    // Capture stdout
    pyodideInstance.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
    `);

    // Clean code before running to avoid some common issues
    const safeCode = code.trim();

    // Check for openpyxl if strictly needed, but avoid auto-install if possible to speed up
    if (safeCode.includes("openpyxl") && micropip) {
      try {
        await micropip.install("openpyxl");
      } catch (e) {
        console.warn("Auto-install of openpyxl failed:", e);
      }
    }

    // Run the code
    await pyodideInstance.runPythonAsync(safeCode);

    const stdout = pyodideInstance.runPython("sys.stdout.getvalue()");
    const stderr = pyodideInstance.runPython("sys.stderr.getvalue()");

    return { output: stdout, error: stderr };
  } catch (err: any) {
    console.error("Python Execution Error:", err);
    return { output: "", error: err.toString() };
  }
};

export const isPyodideReady = () => !!pyodideInstance;
