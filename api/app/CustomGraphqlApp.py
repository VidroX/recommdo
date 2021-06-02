import json

from starlette import status
from starlette.background import BackgroundTasks
from starlette.graphql import GraphQLApp
from starlette.requests import Request
from starlette.responses import PlainTextResponse, Response, JSONResponse
from graphql.error import format_error as format_graphql_error


class CustomGraphqlApp(GraphQLApp):
    async def handle_graphql(self, request: Request) -> Response:
        if request.method in ("GET", "HEAD"):
            if "text/html" in request.headers.get("Accept", ""):
                if not self.graphiql:
                    return PlainTextResponse(
                        "Not Found", status_code=status.HTTP_404_NOT_FOUND
                    )
                return await self.handle_graphiql(request)

            data = request.query_params

        elif request.method == "POST":
            content_type = request.headers.get("Content-Type", "")

            if "application/json" in content_type:
                data = await request.json()
            elif "application/graphql" in content_type:
                body = await request.body()
                text = body.decode()
                data = {"query": text}
            elif "multipart/form-data" in content_type:
                form = await request.form()
                form: dict = dict(form)
                data: dict = json.loads(form.pop('operations', None))
                map_: dict = json.loads(form.pop('map', None))
                variables: dict = data.get('variables', None)
                if variables is not None:
                    for key in variables.keys():
                        if not bool(variables[key]) or not all(variables[key]):
                            varValue: list = [
                                form.get(k, None) for k in map_.keys()
                            ]
                            variables[key] = varValue
                            data.update({
                                'variables': variables
                            })
            elif "query" in request.query_params:
                data = request.query_params
            else:
                return PlainTextResponse(
                    "Unsupported Media Type",
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                )

        else:
            return PlainTextResponse(
                "Method Not Allowed", status_code=status.HTTP_405_METHOD_NOT_ALLOWED
            )

        try:
            query = data["query"]
            variables = data.get("variables")
            operation_name = data.get("operationName")
        except KeyError:
            return PlainTextResponse(
                "No GraphQL query found in the request",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        background = BackgroundTasks()
        context = {"request": request, "background": background}

        result = await self.execute(
            query, variables=variables, context=context, operation_name=operation_name
        )
        error_data = (
            [format_graphql_error(err) for err in result.errors]
            if result.errors
            else None
        )
        response_data = {"data": result.data}
        if error_data:
            response_data["errors"] = error_data
        status_code = (
            status.HTTP_400_BAD_REQUEST if result.errors else status.HTTP_200_OK
        )

        return JSONResponse(
            response_data, status_code=status_code, background=background
        )
