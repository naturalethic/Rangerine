type AsyncFunction = (...args: any[]) => Promise<any>;
type AsyncNever = () => Promise<never>;

export interface ApiBase<
    Get extends AsyncFunction | AsyncNever,
    Post extends AsyncFunction | AsyncNever,
> {
    input: {
        get: Parameters<Get>;
        post: Parameters<Post>;
    };
    output: {
        get: Awaited<ReturnType<Get>>;
        post: Awaited<ReturnType<Post>>;
    };
}

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

export interface Page<I extends ApiBase<AsyncFunction, AsyncFunction>> {
    children?: React.ReactNode;
    input: I["output"];
}

export type Api<Api> = ApiBase<InferGet<Api>, InferPost<Api>>;
