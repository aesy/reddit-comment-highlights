
export interface HttpRequestOptions {
    method?: "GET" | "PUT" | "POST" | "PATCH" | "DELETE";
    params?: Record<string, string>;
    headers?: Record<string, string>;
    data?: any;
}

export function makeRequest<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        if (options.headers) {
            for (const [ key, value ] of Object.entries(options.headers)) {
                xhr.setRequestHeader(key, value);
            }
        }

        if (options.params) {
            url += toQueryParamString(options.params);
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject(xhr.statusText);
            }
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.open(options.method || "GET", url);

        if (options.data === undefined || options.data === null) {
            xhr.send();
        } else {
            xhr.send(JSON.stringify(options.data));
        }
    });
}

function toQueryParamString(params: Record<string, string>): string {
    const string = Object.entries(params)
        .map(([ key, value ]) => `${ encodeURIComponent(key) }=${ encodeURI(value) }`)
        .join("&");

    if (params.length) {
        return `?${ string }`;
    } else {
        return "";
    }
}
