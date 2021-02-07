const { DefaultAzureCredential } = require("@azure/identity");
const { DnsManagementClient } = require("@azure/arm-dns");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    let outputText = 'Hi!     -The API';

    // when deployed to an azure host the default azure credential will authenticate the specified user assigned managed identity
    const credential = new DefaultAzureCredential();
    const dnsClient = new DnsManagementClient(credential, process.env["AZURE_SUBSCRIPTION_ID"]);

    const recordTypes = ["A", "NS", "CNAME"];

    let dnsMappings = [];
    try {
        for (const recordType of recordTypes) {
            const results = await dnsClient.recordSets.listByType(process.env["AZURE_RESOURCE_GROUP"], process.env["AZURE_DNS_ZONE"], recordType)
            .then(result => {
                context.log(result);
                return result;
            })
            .catch(err => {
                context.error(err);
                throw err;
            });

            for (const result of results) {
                dnsMappings.push({
                    name: result.name,
                    fqdn: result.fqdn,
                });
            }
        }
    } catch (err) {
        outputText += err;
    }

    if (dnsMappings.length > 0) {
        outputText = '';

        for (const dnsMapping of dnsMappings) {
            outputText += ` | <a href="${dnsMapping.fqdn}" target="_blank">${dnsMapping.name}</a>`;
        }
    }

    context.res = {
        body: {
            text: outputText
        }
    };
}