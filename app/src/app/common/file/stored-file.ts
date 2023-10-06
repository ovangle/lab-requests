

export interface StoredFile {
    url: string;
    filename: string;
    origFilename: string;
    contentType: string;

    size: number;
}

export function storedFileFromJson(json: unknown): StoredFile {
    if (typeof json != 'object' || json == null) {
        throw new Error('Expected an object');
    }
    const jsonObj: {[k: string]: any} = json;
    return {
        url: jsonObj['url'],
        filename: jsonObj['filename'],
        origFilename: jsonObj['origFilename'],
        contentType: jsonObj['contentType'],
        size: jsonObj['size']
    }
}

export function storedFileToJson(file: StoredFile): {[k: string]: any} {
    return {
        url: file.url,
        filename: file.filename,
        origFilename: file.origFilename,
        contentType: file.contentType,
        size: file.size
    };
}