import { Request } from 'express';

export const QUERY_MAX_LIMIT = 100
export const QUERY_DEFAULT_LIMIT = 20
export const QUERY_DEFAULT_PAGE = 1

export const getQueryLimit = ( req: Request, fallback: number = QUERY_DEFAULT_LIMIT ) : number => {

    if (req.query.limit === undefined || isNaN(parseInt(req.query.limit as string))) {
        return fallback
    }

    const limit = parseInt(req.query.limit as string)

    if( limit <= 0) {
        return QUERY_DEFAULT_LIMIT
    }

    if( limit > QUERY_MAX_LIMIT) {
        return QUERY_MAX_LIMIT
    }

    return limit
}

export const getQueryPageNumber = (req: Request) : number => {
    const page = parseInt(getQueryValue(req, 'page', QUERY_DEFAULT_PAGE))

    if(page <= 0) {
        return QUERY_DEFAULT_PAGE
    }

    return page
}

export const getQueryValue = (req: Request, key: string, fallback: string|number) : string => {
    if(req.query[key]) {
        return req.query[key] as string
    }

    return fallback as string
}
