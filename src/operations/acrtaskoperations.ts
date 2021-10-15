import tl = require("azure-pipelines-task-lib/task");
import AcrTaskParameters from "../models/acrtaskparameters";

export default class AcrTaskOperations {
    private taskParameters: AcrTaskParameters ;

    constructor(taskParameters: AcrTaskParameters) {
        this.taskParameters = taskParameters;
    }

    public async import(): Promise<void>
    {
        console.log(tl.loc("TestMessage"));
    }
}