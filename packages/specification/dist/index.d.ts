export interface ProjectInfo {
    name: string;
    initialSaveTime: number;
    lastUploadTime: number;
}
export interface BackupAPI {
    '/projects/names': {
        GET: {
            response: ProjectInfo[];
        };
    };
    '/projects/:name': {
        GET: {
            params: {
                name: string;
            };
            response: {
                project: any;
            };
        };
        POST: {
            params: {
                name: string;
            };
            request: {
                project: any;
            };
        };
    };
}
