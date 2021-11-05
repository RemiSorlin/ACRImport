import path = require("path");
import tl = require("azure-pipelines-task-lib/task");
import AcrTaskParameters from "./models/acrtaskparameters"
import AcrClient from "./operations/acrClient"

async function run() { 
    var taskParameters = await new AcrTaskParameters().getAcrTaskParameters();
    var taskOperations = new AcrClient(taskParameters);

    await taskOperations.import();
}

var taskManifestPath = path.join(__dirname, "task.json");
tl.debug("Setting resource path to " + taskManifestPath);
tl.setResourcePath(taskManifestPath);
tl.setResourcePath(path.join( __dirname, 'node_modules/azure-pipelines-tasks-azure-arm-rest-v2/module.json'), true);

run().then((result) =>
   tl.setResult(tl.TaskResult.Succeeded, "")
).catch((error) => {
    tl.setResult(tl.TaskResult.Failed, error)
});