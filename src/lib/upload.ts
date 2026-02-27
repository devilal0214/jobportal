import path from 'path'

/**
 * Returns the absolute path for file uploads based on the UPLOAD_DIR environment variable.
 * Fallback to process.cwd()/uploads if the environment variable is not defined.
 * 
 * @param subfolder Optional subfolder to append to the base upload directory (e.g., 'jobs', 'careers')
 * @returns The absolute resolved upload directory path.
 */
export function getUploadDir(subfolder: string = ''): string {
  // Use UPLOAD_DIR from environment, default to './uploads'
  const baseUploadDir = process.env.UPLOAD_DIR || './uploads'
  
  // Resolve the path relative to the current working directory.
  // path.resolve automatically handles absolute paths (like variables that start with /)
  // or resolves relative paths (like ./uploads) against process.cwd().
  const resolvedBaseDir = path.resolve(process.cwd(), baseUploadDir)
  
  // Join the optional subfolder
  return path.join(resolvedBaseDir, subfolder)
}
