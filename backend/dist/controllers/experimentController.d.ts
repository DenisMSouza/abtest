import { Request, Response } from "express";
export declare const createExperiment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getExperiments: (req: Request, res: Response) => Promise<void>;
export declare const getExperiment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateExperiment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteExperiment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getExperimentVariation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const persistExperimentVariation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getExperimentStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const trackSuccess: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=experimentController.d.ts.map