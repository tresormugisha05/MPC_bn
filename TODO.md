# TODO: Swagger Implementation & Status Code Fixes

## 1. Add Swagger Documentation
- [x] Create `src/config/swagger.ts` - Swagger configuration
- [x] Update `src/server.ts` - Add Swagger UI endpoint
- [x] Add JSDoc comments to `src/Routes/user.routes.ts`
- [x] Add JSDoc comments to `src/Routes/users.routes.ts`
- [x] Add JSDoc comments to `src/Routes/product.routes.ts`
- [x] Add JSDoc comments to `src/Routes/reservation.routes.ts`
- [x] Add JSDoc comments to `src/Routes/order.routes.ts`

## 2. Fix Status Codes in Controllers
- [x] Fix `src/controller/Product.controller.ts` - Add 404 for update/delete
- [x] Fix `src/controller/Reservation.controller.ts` - Fix status codes (404, 409)
- [x] Fix `src/controller/Order.controller.ts` - Add proper error handling (404, 409)

## 3. Testing
- [x] Verify Swagger UI is accessible at /api-docs
- [x] Verify all endpoints return correct status codes
