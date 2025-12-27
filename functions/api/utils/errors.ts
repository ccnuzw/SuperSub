export const createErrorResponse = (message: string, code: number = 500) => {
    return Response.json(
        { success: false, message },
        { status: code }
    );
};
