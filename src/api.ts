import fetch, {Response} from 'node-fetch';
const {API_URL='', API_KEY=''} = process.env;

const BASE_URL = API_URL;
const API_QUERY = `?API_KEY=${API_KEY}`;

export function post(route: string, data: any = {}): Promise<Response> {
    return fetch(BASE_URL + route + API_QUERY, {method: 'POST', body: JSON.stringify(data)});
}

export async function get(route: string): Promise<Response> {
    const response = await fetch(BASE_URL + route + API_QUERY, {method: 'GET'});
    return await response.json();
}

export function patch(route: string, data: any = {}): Promise<Response> {
    return fetch(BASE_URL + route + API_QUERY, {method: 'PATCH', body: JSON.stringify(data)});
}

export function saveChatMessage(username: string, message: string): void {
    post('/tracker/message', {username, message}).then(response => {
        if (response.status === 201) {
            console.log(`New message saved - [${username}]: ${message}`);
        } else {
            console.error('Saving failed with code', response.status)
        }
    });
}

export function saveSubscription(data: any): void {
    post('/tracker/subscription', data).then(response => {
        if (response.status === 201) {
            console.log(`New subscription saved - [${data.login}] with Tier [${data.msg_param_sub_plan_name}]`);
        } else {
            console.error('Saving failed with code', response.status)
        }
    });
}