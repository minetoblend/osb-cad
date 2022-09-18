export function endsWithNumber(str: string) {
    return /[0-9]+$/.test(str);
}

export function getNumberAtEnd(str: string) {
    if (endsWithNumber(str)) {
        // @ts-ignore
        return Number(str.match(/[0-9]+$/)[0]);
    }

    return null;
}
