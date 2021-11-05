import tl = require("azure-pipelines-task-lib/task");
import msRestAzure = require("azure-pipelines-tasks-azure-arm-rest-v2/azure-arm-common");
import { AzureRMEndpoint } from 'azure-pipelines-tasks-azure-arm-rest-v2/azure-arm-endpoint';
import { TaskUtil } from "../utils/utils";
import { AzureEndpoint } from "azure-pipelines-tasks-azure-arm-rest-v2/azureModels";
import { Resources } from "azure-pipelines-tasks-azure-arm-rest-v2/azure-arm-resource";

class AcrRegistry {
    name: string;
    location: string;
    resourceGroup: string;
    loginServer: string;
    resourceId: string;
}

export default class AcrTaskParameters {

    version: string;
    name: string;
    repository: string;
    sourceTag: string;
    sourceRegistry: AcrRegistry;
    targetTag: string;
    targetRegistry: AcrRegistry;
    taskFile: string;
    taskRequestStepType: string;
    valuesFilePath: string;
    arguments: string;
    tags: string[];

    public sourceSubscriptionId: string;
    public targetSubscriptionId: string;
    public sourceCredentials: msRestAzure.ApplicationTokenCredentials;
    public targetCredentials: msRestAzure.ApplicationTokenCredentials;

    public async getAcrTaskParameters() {
        try {
            var sourceConnectedService = tl.getInput("sourceConnectedServiceName", true);
            var targetConnectedService = tl.getInput("targetConnectedServiceName", true);

            var sourceEndpoint = await new AzureRMEndpoint(sourceConnectedService).getEndpoint();
            var targetEndpoint = await new AzureRMEndpoint(targetConnectedService).getEndpoint();

            this.sourceCredentials = sourceEndpoint.applicationTokenCredentials;
            this.targetCredentials = targetEndpoint.applicationTokenCredentials;

            this.sourceSubscriptionId = sourceEndpoint.subscriptionID;
            this.targetSubscriptionId = targetEndpoint.subscriptionID;

            let azureSourceContainerRegistry = tl.getInput("azureSourceContainerRegistry", true);
            let azureTargetContainerRegistry = tl.getInput("azureTargetContainerRegistry", true);

            this.name = tl.getVariable('TASK.DISPLAYNAME');

            this.sourceRegistry = await this.getContainerRegistryDetails(sourceEndpoint, azureSourceContainerRegistry);
            this.targetRegistry = await this.getContainerRegistryDetails(targetEndpoint, azureTargetContainerRegistry);

            return this;
        }
        catch (error) {
            throw new Error(tl.loc("TaskConstructorFailed", error.message));
        }
    }

    private async getContainerRegistryDetails(endpoint: AzureEndpoint, resourceName: string): Promise<AcrRegistry> {
        var azureResources: Resources = new Resources(endpoint);
        var filteredResources: Array<any> = await azureResources.getResources('Microsoft.ContainerRegistry/registries', resourceName);
        if(!filteredResources || filteredResources.length == 0) {
            throw new Error(tl.loc('ResourceDoesntExist', resourceName));
        }
        else if(filteredResources.length == 1) {
            var acrRegistryObject = filteredResources[0];
            let acrRegistry = new AcrRegistry();
            acrRegistry.name = resourceName;
            acrRegistry.location = acrRegistryObject.location;
            acrRegistry.resourceGroup = TaskUtil.getResourceGroupNameFromUrl(acrRegistryObject.id);
            acrRegistry.loginServer = acrRegistryObject.loginServer;
            acrRegistry.resourceId = acrRegistryObject.id;
            return acrRegistry;
        }
        else {
            throw new Error(tl.loc('MultipleResourceGroupFoundForContainerRegistry', resourceName));
        }
    }
}