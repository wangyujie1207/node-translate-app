import * as https from "https";
import * as querystring from "querystring";
import md5 from "md5";
import {appId, appSecret} from './private';

type ErrorMap = {
    [key: string]: string
}
const errorMap: ErrorMap = {
    52003: '用户认证失败',
    52004: 'error2',
    52005: 'error3',
};

export const translate = (word: string) => {
    const salt = Math.random();
    const sign = md5(appId + word + salt + appSecret);
    let from, to;
    if (/[a-zA-Z]/.test(word)) {
        // 英译中
        from = 'en';
        to = 'zh';
    } else {
        // 中译英
        from = 'zh';
        to = 'en';
    }

    const query: string = querystring.stringify({
        q: word, from, to, appid: appId, salt, sign
    });
    const options = {
        hostname: 'fanyi-api.baidu.com',
        port: 443,
        path: '/api/trans/vip/translate?' + query,
        method: 'GET'
    };
    const request = https.request(options, (response) => {
        let chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });
        response.on('end', () => {
            const string: string = Buffer.concat(chunks).toString();
            type BaiduResult = {
                error_code?: string;
                error_msg?: string;
                from: string;
                to: string;
                trans_result: { src: string; dst: string; }[]
            }
            const object: BaiduResult = JSON.parse(string);
            if (object.error_code) {
                console.log(errorMap[object.error_code] || object.error_msg)
                process.exit(2);
            } else {
                object.trans_result.map(obj => {
                    console.log(obj.dst)
                })
                process.exit(0);
            }
        });
    });

    request.on('error', (e) => {
        console.error('error', e);
    });
    request.end();
};