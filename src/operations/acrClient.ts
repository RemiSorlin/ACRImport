import tl = require("azure-pipelines-task-lib/task");
import webClient = require("azure-pipelines-tasks-azure-arm-rest-v2/webClient");
import msRestAzure = require('azure-pipelines-tasks-azure-arm-rest-v2/azure-arm-common');
import AcrTaskParameters from "../models/acrtaskparameters";
import { ServiceClient } from "azure-pipelines-tasks-azure-arm-rest-v2/AzureServiceClient"
import { ImportImageParameters, ImportMode, ImportSource } from "../models/acrApiClient";

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
        let acrName = this.taskParameters.targetRegistry.name;
        let resourceGroupName = this.taskParameters.targetRegistry.resourceGroup;

        tl.debug(`Target ACR name: ${acrName}`);
        
        var requestUri = this.getRequestUri(
            `${acrApibaseUri}/importImage`,
            {
                '{resourceGroupName}': resourceGroupName,
                '{registryName}': acrName,
            });

        const requestMethod = "POST";
        var httpRequest = this._createHttpRequest(requestMethod, requestUri);
        let requestBody: ImportImageParameters = this.getRequestBody();
        httpRequest.body = JSON.stringify(requestBody);

        console.log("Calling REST API");
        tl.debug(httpRequest.body);
    
        await this.beginRequest(httpRequest).then(async (response: webClient.WebResponse) => {
            var statusCode = response.statusCode;
            switch (statusCode) {
                case 200:
                    // Generate Response
                    console.log(tl.loc("ImportSuccessful"));
                    break;
                case 202:
                    // Request accepted, wait response status
                    console.log(tl.loc("Import operation accepted, waiting for operation result..."))
                    tl.debug(JSON.stringify(response.headers));
                    tl.debug("Call location endpoint")
                    var operationResult = await this.getOperationResultAsync(response.headers.location);
                    if (operationResult === "Succeeded") {
                        console.log(tl.loc("ImportSuccessful"));
                    } else {
                        tl.logIssue(tl.IssueType.Error, tl.loc("ImportFailed"));
                    }
                    break;
                default:
                    // Generate exception
                    tl.logIssue(tl.IssueType.Error, tl.loc("ImportFailed"));
            }
        });
    }

    private sleep(ms: number): Promise<any> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async getOperationResultAsync(location: string): Promise<string>
    {
        console.log("Start polling location endpoint.");
        tl.debug(`Location url: ${location}`);

        var httpResultRequest = this._createHttpRequest("GET", location);
        var status = "Pending";
        var retryCount = 1;
        const maxRetryCount = 5;

        while (status === "Pending") {
            await this.sleep(250);
            tl.debug(`Get operation result, attempt ${retryCount} / ${maxRetryCount}.`);

            await this.beginRequest(httpResultRequest).then(async (response: webClient.WebResponse) => {
                let statusCode = response.statusCode;
                if (statusCode === 200) {
                    // Generate Response
                    var responseBody = response.body;
                    status = responseBody.status;
                } else {
                    // Generate exception
                    status = "Error";
                }
            });
            retryCount++;

            if (status === "Pending" && retryCount > maxRetryCount) {
                status = "Timeout";
            }
        }
        return status;
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
        var imageName = tl.getInput("sourceContainerRepository");
        var imageTag = tl.getInput("sourceTag");
        if (imageTag === "") {
            imageTag = "latest";
        }
        var imageNameAndTag = `${imageName}:${imageTag}`;

        var source: ImportSource = {
            resourceId: this.taskParameters.sourceRegistry.resourceId,
            sourceImage: imageNameAndTag,
        };

        var mode: ImportMode = "NoForce";

        var targetImageNameAndTag = "";
        var targetImageTag = tl.getInput("targetTag");
        if (targetImageTag !== "") {
            targetImageNameAndTag = `${imageName}:${targetImageTag}`;
        } else {
            targetImageNameAndTag = imageName;
        }

        return {
            source: source,
            mode: mode,
            targetTags: [ targetImageNameAndTag ]
        };
    }
}