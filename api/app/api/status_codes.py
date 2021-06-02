STATUS_CODE = {
    # Auth related
    0: "Invalid or missing auth header",
    1: "Unable to get auth instance",
    2: "Invalid auth header",
    3: "Invalid or missing refresh token",
    4: "Invalid refresh token",
    5: "Given auth token is revoked or expired",
    # General
    50: "Not all required fields present",
    51: "You do not have enough permission to do this",
    52: "Query params are required",
    53: "Provided ID is not valid",
    54: "Invalid page",
    # User related
    100: "Incorrect E-Mail or Password",
    101: "User with the same E-Mail already exists",
    102: "Password should be 6 or more characters long",
    103: "Invalid E-Mail",
    104: "Unable to register with given information",
    105: "You do not have enough permissions to do that!",
    106: "Cannot find specified Access Level",
    107: "Requested user not found or deleted",
    108: "You cannot remove yourself from the system",
    109: "Given Access Level is incorrect",
    # Project related
    200: "Given Project Name already exists",
    201: "Requested project not found",
    203: "Project is not present in one of the models",
    204: "Not enough information about given user",
    205: "No metadata information found for the requested project",
    206: "No subscriptions information found for the requested project",
    207: "Requested Item not found",
    208: "Project is empty or has not enough data to show statistics",
    209: "Provided item id is incorrect",
    210: "Provided stars value is incorrect. Correct values are between 1 and 5.",
    # Upload related
    900: "Unable to upload file(-s)"
}
