using Backend.Auth.Dto;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Backend.Helpers
{
    public static class BackendValidationMessages
    {
        public static Dictionary<string, string[]> ToErrorDictionary(IEnumerable<IdentityError> errors)
        {
            return errors
                .GroupBy(error => error.Code)
                .ToDictionary(
                    group => group.Key,
                    group => group
                        .Select(MapIdentityErrorToMessageKey)
                        .Distinct(StringComparer.Ordinal)
                        .ToArray());
        }

        public static ErrorResponse CreateValidationErrorResponse(ModelStateDictionary modelState)
        {
            var errors = modelState
                .Where(entry => entry.Value is { Errors.Count: > 0 })
                .ToDictionary(
                    entry => string.IsNullOrWhiteSpace(entry.Key) ? "request" : entry.Key,
                    entry => entry.Value!.Errors
                        .Select(error => MapModelValidationErrorToMessageKey(error.ErrorMessage))
                        .Distinct(StringComparer.Ordinal)
                        .ToArray());

            return new ErrorResponse
            {
                Error = BackendMessageKeys.ValidationFailed,
                Errors = errors,
            };
        }

        public static string MapIdentityErrorToMessageKey(IdentityError error)
        {
            return error.Code switch
            {
                nameof(IdentityErrorDescriber.PasswordMismatch) => BackendMessageKeys.IncorrectPassword,
                nameof(IdentityErrorDescriber.InvalidEmail) => BackendMessageKeys.InvalidEmailAddress,
                nameof(IdentityErrorDescriber.InvalidUserName) => BackendMessageKeys.InvalidUsername,
                nameof(IdentityErrorDescriber.DuplicateEmail) => BackendMessageKeys.EmailAlreadyInUse,
                nameof(IdentityErrorDescriber.DuplicateUserName) => BackendMessageKeys.EmailAlreadyInUse,
                nameof(IdentityErrorDescriber.PasswordTooShort) => BackendMessageKeys.PasswordTooShort,
                nameof(IdentityErrorDescriber.PasswordRequiresDigit) => BackendMessageKeys.PasswordRequiresDigit,
                nameof(IdentityErrorDescriber.PasswordRequiresLower) => BackendMessageKeys.PasswordRequiresLowercase,
                nameof(IdentityErrorDescriber.PasswordRequiresUpper) => BackendMessageKeys.PasswordRequiresUppercase,
                nameof(IdentityErrorDescriber.PasswordRequiresNonAlphanumeric) => BackendMessageKeys.PasswordRequiresSpecialCharacter,
                nameof(IdentityErrorDescriber.PasswordRequiresUniqueChars) => BackendMessageKeys.PasswordRequiresUniqueCharacters,
                _ => BackendMessageKeys.ValidationFailed,
            };
        }

        public static string MapModelValidationErrorToMessageKey(string errorMessage)
        {
            if (string.IsNullOrWhiteSpace(errorMessage))
            {
                return BackendMessageKeys.ValidationFailed;
            }

            // Validation attributes may declare a message key directly via ErrorMessage
            if (errorMessage.StartsWith("backendMessages.", StringComparison.Ordinal))
            {
                return errorMessage;
            }

            if (errorMessage.Contains(" is required", StringComparison.OrdinalIgnoreCase))
            {
                return BackendMessageKeys.FieldRequired;
            }

            if (errorMessage.Contains("not a valid e-mail address", StringComparison.OrdinalIgnoreCase))
            {
                return BackendMessageKeys.InvalidEmailAddress;
            }

            if (errorMessage.Contains("minimum length", StringComparison.OrdinalIgnoreCase))
            {
                return BackendMessageKeys.MinLengthNotMet;
            }

            if (errorMessage.Contains("maximum length", StringComparison.OrdinalIgnoreCase))
            {
                return BackendMessageKeys.MaxLengthExceeded;
            }

            if (errorMessage.Contains("not a valid fully-qualified", StringComparison.OrdinalIgnoreCase))
            {
                return BackendMessageKeys.InvalidUrl;
            }

            return BackendMessageKeys.ValidationFailed;
        }
    }
}