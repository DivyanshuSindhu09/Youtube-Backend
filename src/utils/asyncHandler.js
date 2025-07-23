/* 
const asyncHandler = () => {}
const asyncHandler = (func) => {()=>{}}
const asyncHandler = (func) => aync () => {}
*/


const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err)=>next(err))
    }
}

export {asyncHandler}