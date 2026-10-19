// Run by dotnet in debug mode during development run
import { execSync, spawn } from "child_process";

const log = (msg) => console.log(`[FRONTEND_RUN_DEV] ${msg}`);

async function main() {
    log("Starting frontend...");

    const backendProcessID = process.argv.slice(2);
    
    // Spawn `npm run dev`, and then poll the backend process every second
    // Once the backend process is killed, kill the frontend process as well
    
    const frontendProcess = spawn("npm", ["run", "dev"], { stdio: "inherit", shell: true });
    const pollInterval = setInterval(() => {
        try {
            process.kill(backendProcessID, 0); // Check if the backend process is still alive
        } catch (e) {
            log("Backend process has exited, killing frontend...");
            
            if (process.platform === 'win32') {
                execSync(`taskkill /pid ${frontendProcess.pid} /f /t`);
            } else {
                frontendProcess.kill('SIGKILL');
            }

            clearInterval(pollInterval); // Clear the interval to stop polling
        }
    }, 1000);
}

// IMPORTANT: Set the workdir to ../Frontend if the current folder is Backend, otherwise it will run npm install in the wrong directory
if (process.cwd().endsWith("Backend")) {
    process.chdir("../Frontend");
}

main();