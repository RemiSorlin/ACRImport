import tl = require("azure-pipelines-task-lib/task");

export class TaskUtil {

    public static getResourceGroupNameFromUrl(id: string): string {
        if(!id){
            throw new Error(tl.loc("UnableToFindResourceGroupDueToNullId"));
        }
        const pathArray =id.split("/");
        if(pathArray.length <=0 || !pathArray[3] || pathArray[3].toLowerCase() != 'resourcegroups'){
            throw new Error(tl.loc("UnableToFindResourceGroupDueToInvalidId"));
        }

        return pathArray[4];
    }
}
