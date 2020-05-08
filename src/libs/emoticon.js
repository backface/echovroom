// Emoji replace

if (!String.prototype.replaceAll ) {
    String.prototype.replaceAll = function (find, newToken) {
        var str = this, i = -1;

        if (!str) {
            // Instead of throwing, act as COALESCE if find == null/empty and str == null
            if ((str == null) && (find == null))
                return newToken;

            return str;
        }

        if (!find) // sanity check
            return str;

        while ((i = str.indexOf(find, i >= 0 ? i + newToken.length : 0)) !== -1) {
            str = str.substring(0, i) + newToken + str.substring(i + find.length);
        } // Whend

        return str;
    };
}

var emojiMap = {
    "<3": "\u2764\uFE0F",
    "</3": "\uD83D\uDC94",
    ":D": "\uD83D\uDE00",
    ":-)": "\uD83D\uDE03",
    ":)": "\uD83D\uDE03",
    ";-)": "\uD83D\uDE09",
    ";)": "\uD83D\uDE09",
    ":-(": "\uD83D\uDE12",
    ":(": "\uD83D\uDE12",
    ":p": "\uD83D\uDE1B",
    ";p": "\uD83D\uDE1C",
    ":'(": "\uD83D\uDE22"
 };

function escapeSpecialChars(regex) {
    return regex.replace(/([()[{*+.$^\\|?])/g, '\\$1');
}

function replaceEmoticons(str) {
    var repStr = str

    for (var i in emojiMap) {
        var regex = new RegExp(escapeSpecialChars(i), 'gim');
        repStr = repStr.replace(regex, emojiMap[i]);
    }
    return repStr
}

export { replaceEmoticons };
