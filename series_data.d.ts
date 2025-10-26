export interface SeriesDataD {
    id:                      string;
    title:                   string;
    titleCaptionTranslation: null;
    cover:                   Cover | null;
    tags:                    string[];
    xRestrict:               number;
    isOriginal:              boolean;
    genre:                   string;
    createDateTime:          Date;
    updateDateTime:          Date;
    userId:                  string;
    userName:                string;
    profileImageUrl:         string;
    bookmarkCount:           number;
    isOneshot:               boolean;
    caption:                 string;
    isConcluded?:            boolean;
    episodeCount?:           number;
    publishedEpisodeCount?:  number;
    latestPublishDateTime?:  Date;
    latestEpisodeId?:        string;
    isWatched?:              boolean;
    isNotifying?:            boolean;
    restrict:                number;
    textLength:              number;
    wordCount:               number;
    readingTime:             number;
    publishedTextLength:     number;
    publishedWordCount:      number;
    publishedReadingTime:    number;
    useWordCount:            boolean;
    aiType:                  number;
    captionAsHtml?:          string;
    publishedDateTime?:      Date;
    novelId?:                string;
    bookmarkData?:           null;
    isBookmarkable?:         boolean;
}

interface Cover {
    urls: Urls;
}

interface Urls {
    "240mw":     string;
    "480mw":     string;
    "1200x1200": string;
    "128x128":   string;
    original:    string;
}
