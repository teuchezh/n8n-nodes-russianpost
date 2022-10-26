import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { parseString } from 'xml2js';

export class RussianPost implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Russian Post Node',
		name: 'RussianPost',
		icon: 'file:icon.svg',
		group: ['input'],
		version: 1,
		description: 'Russian Post Node',
		defaults: {
			name: 'Russian Post Node',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'russianPostCredentialsApi',
				required: true,
			},
		],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Track Number',
				name: 'barcode',
				type: 'string',
				default: '',
				placeholder: 'Placeholder value',
				description: 'The description text',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('russianPostCredentialsApi');
		const returnData: INodeExecutionData[] = [];

		try {
			const trackNumber = this.getNodeParameter('barcode', 0) as string;
			const response = await this.helpers.request({
				method: 'POST',
				url: `https://tracking.russianpost.ru/rtm34`,
				headers: {
					'Content-Type': 'application/soap+xml; charset=utf-8',
				},
				body: `<?xml version="1.0" encoding="UTF-8"?>
								<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:oper="http://russianpost.org/operationhistory" xmlns:data="http://russianpost.org/operationhistory/data" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
								    <soap:Header/>
								    <soap:Body>
								        <oper:getOperationHistory>
								            <data:OperationHistoryRequest>
								                <data:Barcode>${trackNumber}</data:Barcode>
								                <data:MessageType>0</data:MessageType>
								                <data:Language>RUS</data:Language>
								            </data:OperationHistoryRequest>
								            <data:AuthorizationHeader soapenv:mustUnderstand="1">
								                <data:login>${credentials.login}</data:login>
								                <data:password>${credentials.password}</data:password>
								            </data:AuthorizationHeader>
								        </oper:getOperationHistory>
								    </soap:Body>
								</soap:Envelope>`,
			});

			parseString(response, (err, result) => {
				if (err) {
					throw new NodeOperationError(this.getNode(), err);
				}
				returnData.push({ json: result });
			});
		} catch (error) {
			throw new NodeOperationError(this.getNode(), error);
		}

		return this.prepareOutputData(returnData);
	}
}
