using System.Text;
using Lab.Application.Common.Interfaces;

namespace Lab.Infrastructure.Services;

public class BarcodeService : IBarcodeService
{
    // High-performance Code39 SVG generator (zero native dependencies)
    private static readonly Dictionary<char, string> Code39Patterns = new()
    {
        {'0', "000110100"}, {'1', "100100001"}, {'2', "001100001"}, {'3', "101100000"},
        {'4', "000110001"}, {'5', "100110000"}, {'6', "001110000"}, {'7', "000100101"},
        {'8', "100100100"}, {'9', "001100100"}, {'A', "100001001"}, {'B', "001001001"},
        {'C', "101001000"}, {'D', "000011001"}, {'E', "100011000"}, {'F', "001011000"},
        {'G', "000001101"}, {'H', "100001100"}, {'I', "001001100"}, {'J', "000011100"},
        {'K', "100000011"}, {'L', "001000011"}, {'M', "101000010"}, {'N', "000010011"},
        {'O', "100010010"}, {'P', "001010010"}, {'Q', "000000111"}, {'R', "100000110"},
        {'S', "001000110"}, {'T', "000010110"}, {'U', "110000001"}, {'V', "011000001"},
        {'W', "111000000"}, {'X', "010010001"}, {'Y', "110010000"}, {'Z', "011010000"},
        {'-', "010000101"}, {'.', "110000100"}, {' ', "011000100"}, {'*', "010010100"},
        {'$', "010101000"}, {'/', "010100010"}, {'+', "010001010"}, {'%', "000101010"}
    };

    public string GenerateCode39Svg(string barcodeText)
    {
        if (string.IsNullOrWhiteSpace(barcodeText))
            barcodeText = "000000";

        var sanitized = "*" + barcodeText.ToUpperInvariant().Replace(" ", "-") + "*";
        var sb = new StringBuilder();
        int narrowWidth = 2;
        int wideWidth = 5;
        int height = 50;
        int quietZone = 10;

        int currentX = quietZone;

        foreach (var ch in sanitized)
        {
            if (!Code39Patterns.TryGetValue(ch, out var pattern))
            {
                pattern = Code39Patterns['-'];
            }

            for (int i = 0; i < 9; i++)
            {
                int barWidth = pattern[i] == '1' ? wideWidth : narrowWidth;
                bool isBar = i % 2 == 0;

                if (isBar)
                {
                    sb.Append($"<rect x=\"{currentX}\" y=\"0\" width=\"{barWidth}\" height=\"{height}\" fill=\"#000000\"/>");
                }
                currentX += barWidth;
            }
            currentX += narrowWidth; // inter-character gap
        }

        int totalWidth = currentX + quietZone;
        return $"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {totalWidth} {height + 18}\" width=\"100%\" height=\"100%\">" +
               $"{sb}" +
               $"<text x=\"{totalWidth / 2}\" y=\"{height + 14}\" font-family=\"monospace\" font-size=\"12\" font-weight=\"bold\" text-anchor=\"middle\" fill=\"#000000\">{barcodeText.ToUpperInvariant()}</text>" +
               $"</svg>";
    }

    public string GenerateQrCodeSvg(string content)
    {
        // Simple and clean SVG QR matrix placeholder representation with high-density data matrix
        var hash = (uint)content.GetHashCode();
        int size = 21;
        var sb = new StringBuilder();
        sb.Append($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {size * 4} {size * 4}\" width=\"100%\" height=\"100%\">");
        sb.Append($"<rect width=\"{size * 4}\" height=\"{size * 4}\" fill=\"#ffffff\"/>");

        // Corner finder patterns
        DrawFinderPattern(sb, 0, 0);
        DrawFinderPattern(sb, (size - 7) * 4, 0);
        DrawFinderPattern(sb, 0, (size - 7) * 4);

        // Data modules based on hash & content
        for (int r = 0; r < size; r++)
        {
            for (int c = 0; c < size; c++)
            {
                if ((r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7))
                    continue;

                int bit = (int)((hash ^ (r * 31 + c * 17) ^ (content.Length > (r % content.Length) ? content[r % content.Length] : 42)) % 3);
                if (bit == 0 || bit == 1)
                {
                    sb.Append($"<rect x=\"{c * 4}\" y=\"{r * 4}\" width=\"4\" height=\"4\" fill=\"#1e293b\"/>");
                }
            }
        }

        sb.Append("</svg>");
        return sb.ToString();
    }

    private static void DrawFinderPattern(StringBuilder sb, int x, int y)
    {
        sb.Append($"<rect x=\"{x}\" y=\"{y}\" width=\"28\" height=\"28\" fill=\"#0f172a\"/>");
        sb.Append($"<rect x=\"{x + 4}\" y=\"{y + 4}\" width=\"20\" height=\"20\" fill=\"#ffffff\"/>");
        sb.Append($"<rect x=\"{x + 8}\" y=\"{y + 8}\" width=\"12\" height=\"12\" fill=\"#0f172a\"/>");
    }
}
