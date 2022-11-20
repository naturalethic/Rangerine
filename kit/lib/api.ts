export type AsyncFunction = (...args: any[]) => Promise<any>;
export type AsyncNever = () => Promise<never>;

export interface ApiInputBase<
    Get extends AsyncFunction | AsyncNever,
    Post extends AsyncFunction | AsyncNever,
> {
    get: Parameters<Get>;
    post: Parameters<Post>;
}

export interface ApiOutputBase<
    Get extends AsyncFunction | AsyncNever,
    Post extends AsyncFunction | AsyncNever,
> {
    get?: Awaited<ReturnType<Get>>;
    post?: Awaited<ReturnType<Post>>;
}

export type ApiBase<
    Get extends AsyncFunction | AsyncNever,
    Post extends AsyncFunction | AsyncNever,
> = {
    input: ApiInputBase<Get, Post>;
    output: ApiOutputBase<Get, Post>;
};

// export interface ApiBase<
//     Get extends AsyncFunction | AsyncNever,
//     Post extends AsyncFunction | AsyncNever,
// > {
//     input: {
//         get: Parameters<Get>;
//         post: Parameters<Post>;
//     };
//     output: {
//         get?: Awaited<ReturnType<Get>>;
//         post?: Awaited<ReturnType<Post>>;
//     };
// }

type InferGet<Api> = Api extends { get: infer Get }
    ? Get extends AsyncFunction
        ? Get
        : AsyncNever
    : AsyncNever;
type InferPost<Api> = Api extends { post: infer Post }
    ? Post extends AsyncFunction
        ? Post
        : AsyncNever
    : AsyncNever;

export type ApiInput<Api> = ApiInputBase<InferGet<Api>, InferPost<Api>>;
export type ApiOutput<Api> = ApiOutputBase<InferGet<Api>, InferPost<Api>>;
export type Api<Api> = ApiBase<InferGet<Api>, InferPost<Api>>;
