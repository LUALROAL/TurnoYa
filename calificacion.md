[a].[Notes], [a].[PaymentMethod], [a].[PaymentStatus], [a].[ReferenceNumber], [a].[ReminderSent], [a].[ScheduledDate], [a].[ServiceId], [a].[Status], [a].[TotalAmount], [a].[UpdatedAt], [a].[UserId], [a].[WompiReference], [a].[WompiTransactionId]
FROM [Appointments] AS [a]
WHERE [a].[Id] = @__dto_AppointmentId_0 AND [a].[UserId] = @__dto_CustomerId_1 AND [a].[BusinessId] = @__dto_BusinessId_2
[BusinessValidationService] Found appointment: Status=Completed
[14:57:00 ERR] Failed executing DbCommand (9ms) [Parameters=[@p0='?' (DbType = Guid), @p1='?' (DbType = Guid), @p2='?' (DbType = Guid), @p3='?' (DbType = DateTime2), @p4='?' (DbType = Boolean), @p5='?' (DbType = Int32), @p6='?' (DbType = DateTime2), @p7='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SET IMPLICIT_TRANSACTIONS OFF;
SET NOCOUNT ON;
INSERT INTO [BusinessValidations] ([Id], [AppointmentId], [BusinessId], [CreatedAt], [KnowsBusiness], [Rating], [UpdatedAt], [UserId])
VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7);
[14:57:00 ERR] An exception occurred in the database while saving changes for context type 'TurnoYa.Infrastructure.Data.ApplicationDbContext'.
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.SqlClient.SqlException (0x80131904): Cannot insert duplicate key row in object 'dbo.BusinessValidations' with unique index 'IX_BusinessValidations_BusinessId_UserId'. The duplicate key value is (ee414f72-7a4b-4138-a2f7-93527542efff, 185836ff-feb8-4929-bbe3-f4812afa50de).
The statement has been terminated.
   at Microsoft.Data.SqlClient.SqlCommand.<>c.<ExecuteDbDataReaderAsync>b__211_0(Task`1 result)
   at System.Threading.Tasks.ContinuationResultTaskFromResultTask`2.InnerInvoke()
   at System.Threading.ExecutionContext.RunInternal(ExecutionContext executionContext, ContextCallback callback, Object state)
--- End of stack trace from previous location ---
   at System.Threading.ExecutionContext.RunInternal(ExecutionContext executionContext, ContextCallback callback, Object state)
   at System.Threading.Tasks.Task.ExecuteWithThreadLocal(Task& currentTaskSlot, Thread threadPoolThread)
--- End of stack trace from previous location ---
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
ClientConnectionId:80947c76-8693-4715-9dcf-ab5372647df4
Error Number:2601,State:1,Class:14
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.SqlServer.Update.Internal.SqlServerModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.SqlServer.Storage.Internal.SqlServerExecutionStrategy.ExecuteAsync[TState,TResult](TState state, Func`4 operation, Func`4 verifySucceeded, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.SqlClient.SqlException (0x80131904): Cannot insert duplicate key row in object 'dbo.BusinessValidations' with unique index 'IX_BusinessValidations_BusinessId_UserId'. The duplicate key value is (ee414f72-7a4b-4138-a2f7-93527542efff, 185836ff-feb8-4929-bbe3-f4812afa50de).
The statement has been terminated.
   at Microsoft.Data.SqlClient.SqlCommand.<>c.<ExecuteDbDataReaderAsync>b__211_0(Task`1 result)
   at System.Threading.Tasks.ContinuationResultTaskFromResultTask`2.InnerInvoke()
   at System.Threading.ExecutionContext.RunInternal(ExecutionContext executionContext, ContextCallback callback, Object state)
--- End of stack trace from previous location ---
   at System.Threading.ExecutionContext.RunInternal(ExecutionContext executionContext, ContextCallback callback, Object state)
   at System.Threading.Tasks.Task.ExecuteWithThreadLocal(Task& currentTaskSlot, Thread threadPoolThread)
--- End of stack trace from previous location ---
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
ClientConnectionId:80947c76-8693-4715-9dcf-ab5372647df4
Error Number:2601,State:1,Class:14
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.SqlServer.Update.Internal.SqlServerModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.SqlServer.Storage.Internal.SqlServerExecutionStrategy.ExecuteAsync[TState,TResult](TState state, Func`4 operation, Func`4 verifySucceeded, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
[14:57:00 ERR] Error al crear validación de negocio
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.SqlClient.SqlException (0x80131904): Cannot insert duplicate key row in object 'dbo.BusinessValidations' with unique index 'IX_BusinessValidations_BusinessId_UserId'. The duplicate key value is (ee414f72-7a4b-4138-a2f7-93527542efff, 185836ff-feb8-4929-bbe3-f4812afa50de).
The statement has been terminated.
   at Microsoft.Data.SqlClient.SqlCommand.<>c.<ExecuteDbDataReaderAsync>b__211_0(Task`1 result)
   at System.Threading.Tasks.ContinuationResultTaskFromResultTask`2.InnerInvoke()
   at System.Threading.ExecutionContext.RunInternal(ExecutionContext executionContext, ContextCallback callback, Object state)
--- End of stack trace from previous location ---
   at System.Threading.ExecutionContext.RunInternal(ExecutionContext executionContext, ContextCallback callback, Object state)
   at System.Threading.Tasks.Task.ExecuteWithThreadLocal(Task& currentTaskSlot, Thread threadPoolThread)
--- End of stack trace from previous location ---
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
ClientConnectionId:80947c76-8693-4715-9dcf-ab5372647df4
Error Number:2601,State:1,Class:14
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.SqlServer.Update.Internal.SqlServerModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.SqlServer.Storage.Internal.SqlServerExecutionStrategy.ExecuteAsync[TState,TResult](TState state, Func`4 operation, Func`4 verifySucceeded, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at TurnoYa.Infrastructure.Repositories.BusinessValidationRepository.CreateAsync(BusinessValidation validation) in C:\Users\USUARIO\Desktop\TurnoYa\TurnoYaAPI\TurnoYa.Infrastructure\Repositories\BusinessValidationRepository.cs:line 24
   at TurnoYa.Infrastructure.Services.BusinessValidationService.CreateValidationAsync(CreateBusinessValidationDto dto, Guid userId) in C:\Users\USUARIO\Desktop\TurnoYa\TurnoYaAPI\TurnoYa.Infrastructure\Services\BusinessValidationService.cs:line 86
   at TurnoYa.API.Controllers.BusinessValidationsController.Create(CreateBusinessValidationDto dto) in C:\Users\USUARIO\Desktop\TurnoYa\TurnoYaAPI\TurnoYa.API\Controllers\BusinessValidationsController.cs:line 48
[14:57:00 INF] Executing ObjectResult, writing value of type '<>f__AnonymousType1`1[[System.String, System.Private.CoreLib, Version=8.0.0.0, Culture=neutral, PublicKeyToken=7cec85d7bea7798e]]'.
[14:57:00 INF] Executed action TurnoYa.API.Controllers.BusinessValidationsController.Create (TurnoYa.API) in 168.5796ms
[14:57:00 INF] Executed endpoint 'TurnoYa.API.Controllers.BusinessValidationsController.Create (TurnoYa.API)'
[14:57:00 INF] Request finished HTTP/2 POST https://localhost:7187/api/BusinessValidations - 500 null application/json; charset=utf-8 183.6257ms
[14:57:17 INF] Client disconnected: 4ZTEjbAh_gXPpyUeytAHnQ
[14:57:17 INF] Executed endpoint '/hubs/notifications'
[14:57:17 INF] Request finished HTTP/2 CONNECT https://localhost:7187/hubs/notifications?id=7k0N10BRjPkbVBFBjkIWqQ&access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxODU4MzZmZi1mZWI4LTQ5MjktYmJlMy1mNDgxMmFmYTUwZGUiLCJlbWFpbCI6ImFsZWpvcm9kcnlndWV6MTYyQGdtYWlsLmNvbSIsInVuaXF1ZV9uYW1lIjoiYWxlamFuZHJvIHJvZHJpZ3VleiIsInJvbGUiOiJDdXN0b21lciIsImZpcnN0TmFtZSI6ImFsZWphbmRybyIsImxhc3ROYW1lIjoicm9kcmlndWV6IiwibmJmIjoxNzc3NTc1MjIxLCJleHAiOjE3Nzc2NjE2MjEsImlhdCI6MTc3NzU3NTIyMSwiaXNzIjoiVHVybm9ZYUlzc3VlciIsImF1ZCI6IlR1cm5vWWFBdWRpZW5jZSJ9.pI--js8EzSGb4F3aTHtejZpULs0FzvPlqaCnzLTh1mI - 200 null null 23496.2434ms
[14:57:17 INF] Connection id "0HNL6U9US08GJ", Request id "0HNL6U9US08GJ:00000003": the application completed without reading the entire request body.
[14:57:20 INF] Request starting HTTP/2 OPTIONS https://localhost:7187/hubs/notifications/negotiate?negotiateVersion=1 - null null
[14:57:20 INF] CORS policy execution successful.
[14:57:20 INF] Request finished HTTP/2 OPTIONS https://localhost:7187/hubs/notifications/negotiate?negotiateVersion=1 - 204 null null 7.0622ms
[14:57:20 INF] Request starting HTTP/2 POST https://localhost:7187/hubs/notifications/negotiate?negotiateVersion=1 - null 0
[14:57:20 INF] CORS policy execution successful.
[14:57:20 INF] CORS policy execution successful.
[14:57:20 INF] Executing endpoint '/hubs/notifications/negotiate'
[14:57:20 INF] Executed endpoint '/hubs/notifications/negotiate'
[14:57:20 INF] Request finished HTTP/2 POST https://localhost:7187/hubs/notifications/negotiate?negotiateVersion=1 - 200 316 application/json 9.6481ms
[14:57:20 INF] Request starting HTTP/2 CONNECT https://localhost:7187/hubs/notifications?id=GfO3zUgE1RtWQDyzhIMqOw&access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIyNjJiMDM0Zi1kMTdhLTRiNGItYmFkZS02ZmY0YzhhZjk3OWUiLCJlbWFpbCI6IngxMjU1MTgzOUBnbWFpbC5jb20iLCJ1bmlxdWVfbmFtZSI6IlR1cm5vWWEgQXBwIiwicm9sZSI6Ik93bmVyQnVzaW5lc3MiLCJmaXJzdE5hbWUiOiJUdXJub1lhIiwibGFzdE5hbWUiOiJBcHAiLCJidXNpbmVzc19pZCI6ImVlNDE0ZjcyLTdhNGItNDEzOC1hMmY3LTkzNTI3NTQyZWZmZiIsIm5iZiI6MTc3NzU3Mzc3MCwiZXhwIjoxNzc3NjYwMTcwLCJpYXQiOjE3Nzc1NzM3NzAsImlzcyI6IlR1cm5vWWFJc3N1ZXIiLCJhdWQiOiJUdXJub1lhQXVkaWVuY2UifQ.FFlyZV7CVQ_6XTU-doLasjgOdrmyNQ5h5tX9yBVMSFU - null null
[14:57:20 INF] CORS policy execution successful.
[14:57:20 INF] CORS policy execution successful.
[14:57:20 INF] Executing endpoint '/hubs/notifications'
[14:57:20 INF] Client connected: 6IQedL9OxmqsAe0IYyXPug joined group user:262b034f-d17a-4b4b-bade-6ff4c8af979e
[14:57:20 INF] Dueño 262b034f-d17a-4b4b-bade-6ff4c8af979e unido a SignalR: 6IQedL9OxmqsAe0IYyXPug escuchando business:ee414f72-7a4b-4138-a2f7-93527542efff
[14:57:20 INF] Client disconnected: 6IQedL9OxmqsAe0IYyXPug
[14:57:20 INF] Executed endpoint '/hubs/notifications'
[14:57:20 INF] Request finished HTTP/2 CONNECT https://localhost:7187/hubs/notifications?id=GfO3zUgE1RtWQDyzhIMqOw&access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIyNjJiMDM0Zi1kMTdhLTRiNGItYmFkZS02ZmY0YzhhZjk3OWUiLCJlbWFpbCI6IngxMjU1MTgzOUBnbWFpbC5jb20iLCJ1bmlxdWVfbmFtZSI6IlR1cm5vWWEgQXBwIiwicm9sZSI6Ik93bmVyQnVzaW5lc3MiLCJmaXJzdE5hbWUiOiJUdXJub1lhIiwibGFzdE5hbWUiOiJBcHAiLCJidXNpbmVzc19pZCI6ImVlNDE0ZjcyLTdhNGItNDEzOC1hMmY3LTkzNTI3NTQyZWZmZiIsIm5iZiI6MTc3NzU3Mzc3MCwiZXhwIjoxNzc3NjYwMTcwLCJpYXQiOjE3Nzc1NzM3NzAsImlzcyI6IlR1cm5vWWFJc3N1ZXIiLCJhdWQiOiJUdXJub1lhQXVkaWVuY2UifQ.FFlyZV7CVQ_6XTU-doLasjgOdrmyNQ5h5tX9yBVMSFU - 200 null null 751.8358ms
[14:57:20 INF] Connection id "0HNL6U9US08GL", Request id "0HNL6U9US08GL:00000003": the application completed without reading the entire request body.
