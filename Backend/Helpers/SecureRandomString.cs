using System.Security.Cryptography;

namespace Backend.Helpers
{
    public static class SecureRandomString
    {
        public static string Generate(int length, string allowedCharacters, params string[] requiredCharacterSets)
        {
            ArgumentOutOfRangeException.ThrowIfNegativeOrZero(length);

            if (string.IsNullOrWhiteSpace(allowedCharacters))
            {
                throw new ArgumentException("Allowed characters must not be empty.", nameof(allowedCharacters));
            }

            if (requiredCharacterSets.Any(string.IsNullOrEmpty))
            {
                throw new ArgumentException("Required character sets must not contain empty values.", nameof(requiredCharacterSets));
            }

            if (requiredCharacterSets.Length > length)
            {
                throw new ArgumentException("Required character sets cannot exceed the requested length.", nameof(requiredCharacterSets));
            }

            var result = new char[length];
            var position = 0;

            foreach (var characterSet in requiredCharacterSets)
            {
                result[position++] = characterSet[RandomNumberGenerator.GetInt32(characterSet.Length)];
            }

            while (position < result.Length)
            {
                result[position++] = allowedCharacters[RandomNumberGenerator.GetInt32(allowedCharacters.Length)];
            }

            for (var index = result.Length - 1; index > 0; index--)
            {
                var swapIndex = RandomNumberGenerator.GetInt32(index + 1);
                (result[index], result[swapIndex]) = (result[swapIndex], result[index]);
            }

            return new string(result);
        }
    }
}