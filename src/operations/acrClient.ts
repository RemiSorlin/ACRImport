import tl = require("azure-pipelines-task-lib/task");
import webClient = require("azure-pipelines-tasks-azure-arm-rest-v2/webClient");
import msRestAzure = require('azure-pipelines-tasks-azure-arm-rest-v2/azure-arm-common');
import AcrTaskParameters from "../models/acrtaskparameters";
import { ServiceClient } from "azure-pipelines-tasks-azure-arm-rest-v2/AzureServiceClient"
import { ImportImageParameters, ImportMode, ImportSource, ImportSourceCredentials } from "../models/acrApiClient";

const acrApibaseUri: string = "//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ContainerRegistry/registries/{registryName}";

export default class AcrClient extends ServiceClient {
    private taskParameters: AcrTaskParameters;

    constructor(taskParameters: AcrTaskParameters) {
        let credentials: msRestAzure.ApplicationTokenCredentials = taskParameters.targetCredentials;
        let subscriptionId: string = taskParameters.targetSubscriptionId;

        super(credentials, subscriptionId);

        this.taskParameters = taskParameters;
        this.apiVersion = '2019-05-01';
    }

    public async import(): Promise<void>
    {
        let acrRegName = this.taskParameters.targetRegistry.name;
        let resourceGroupName = this.taskParameters.targetRegistry.resourceGroup;
        
        var requestUri = this.getRequestUri(
            `${acrApibaseUri}/importImage`,
            {
                '{resourceGroupName}': resourceGroupName,
                '{registryName}': acrRegName,
            });

        const requestMethod = "POST";
        var httpRequest = this._createHttpRequest(requestMethod, requestUri);
        let requestBody: ImportImageParameters = this.getRequestBody();
        httpRequest.body = JSON.stringify(requestBody);

        console.log("Calling REST API");
        console.log(httpRequest.body);
    
        // this.beginRequest(httpRequest).then(async (response: webClient.WebResponse) => {
        //     var statusCode = response.statusCode;
        //     if (statusCode === 200) {
        //         // Generate Response
        //         console.log(tl.loc("ImportSuccessful"));
        //     }
        //     else {
        //         // Generate exception
        //         tl.logIssue(tl.IssueType.Error, tl.loc("ImportFailed"));
        //     }
        // });
    }

    private _createHttpRequest(method: string, requestUri): webClient.WebRequest {
        var httpRequest = new webClient.WebRequest();
        httpRequest.method = method;
        httpRequest.headers = {};
        httpRequest.uri = requestUri
        return httpRequest;
    }

    private getRequestBody(): ImportImageParameters
    {
        var sourceCredentials: ImportSourceCredentials = {
            username: "",
            password: ""
        };

        var imageName = tl.getInput("sourceContainerRepository");
        var imageTag = tl.getInput("sourceTag");
        if (imageTag === "") {
            imageTag = "latest";
        }
        var imageNameAndTag = `${imageName}:${imageTag}`;

        var source: ImportSource = {
            registryUri: "",
            resourceId: this.taskParameters.sourceRegistry.resourceId,
            sourceImage: imageNameAndTag,
            credentials: sourceCredentials
        };

        var mode: ImportMode = "NoForce";

        var targetImageNameAndTag = "";
        var targetImageTag = tl.getInput("targetTag");
        if (targetImageTag === "") {
            targetImageNameAndTag = `${imageName}:${targetImageTag}`;
        } else {
            targetImageNameAndTag = imageName;
        }

        return {
            source: source,
            mode: mode,
            targetTags: []
        };
    }
}