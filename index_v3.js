const OPTIMUM_COLLECTION = "msvod_all_optimum"
const NEW_PROMO_COLLECTION = "new-promo"
const PARAMOUNT_SUBSCRIPTION = "746996"

const COLLECTION = "COLLECTION"
const SUBSCRIPTION = "SUBSCRIPTION"

const COVER_IMAGE_TYPE = "COVER"
const PORTRAIT_IMAGE_TYPE = "PORTRAIT"

const UTF8_ENCODING = "utf-8"

function disableAllBtns() {
    Array.from(document.querySelectorAll("button")).forEach(btn => btn.disabled = true)
}

function enableAllBtns() {
    Array.from(document.querySelectorAll("button")).forEach(btn => btn.disabled = false)
}

function fetchJson(elementAlias, elementType, limit) {
    disableAllBtns()
    console.log('fetching for ', ...arguments)
    return fetch(`https://ctx.playfamily.ru/screenapi/v1/noauth/collection/web/1?elementAlias=${elementAlias}&elementType=${elementType}&limit=${limit}&offset=0&withInnerCollections=true`)
        .then(res => res.json())
        .then(res => {
            enableAllBtns()
            return res
        })
        .catch(e => {
            enableAllBtns()
            alert(e)
        })
}

async function downloadFilms(elementAlias, elementType) {
    const films = await fetchFilms(elementAlias, elementType)
    const headers = [
        "ID",
        "Item title",
        "Final URL",
        "Image URL",
        "Item subtitle",
        "Item description",
        "Sale price",
        "Price",
    ]
    const rows = films.map(film => {
        const urlWords = film.picCoverUrl.split("/")

        return [
            urlWords[urlWords.length - 1],
            film.name,
            film.url,
            film.picCoverUrl,
            film.name,
            "Купить фильм за 1₽",
            "",
            "1 RUB",
        ]
    })

    downloadCsv(
        `films_${elementAlias}_${new Date().toISOString()}.csv`,
        ',',
        headers,
        rows,
        UTF8_ENCODING
    )
}

async function fetchFilms(elementAlias, elementType) {
    const firstResponse = await fetchJson(elementAlias, elementType, 10)
    const secondResponse = await fetchJson(elementAlias, elementType, firstResponse.element.collectionItems.totalSize)

    return secondResponse.element.collectionItems.items.map(item => {
        const coverItem = item.element.basicCovers.items.find(it => it.imageType === COVER_IMAGE_TYPE)
        const portraitItem = item.element.basicCovers.items.find(it => it.imageType === PORTRAIT_IMAGE_TYPE)

        return {
            name: item.element.name,
            url: `https://okko.tv/${item.element.type}/${item.element.alias}`,
            picCoverUrl: coverItem ? coverItem.url : '',
            picPortraitUrl: portraitItem ? portraitItem.url : '',
        }
    })
}

function downloadCsv(fileName, separator, headers, rows, encoding) {
    let content = '';
    [headers, ...rows].forEach(row => {
        const newRow = row.map(cell => {
            if (cell.includes(separator)) {
                if (cell.includes('"')) {
                    cell = cell.replace('"', "'")
                }
                return `"${cell}"`
            }
            return cell
        })
        content += newRow.join(separator) + '\r\n'
    })

    const link = document.createElement("a");
    if (link.download === undefined) {
        return
    }

    const blob = new Blob([content], { type: `text/csv;charset=${encoding};` })
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

window.onload = function () {
    document.querySelector(`#${OPTIMUM_COLLECTION}`)
        .addEventListener('click', () => downloadFilms(OPTIMUM_COLLECTION, COLLECTION))
    document.querySelector(`#${NEW_PROMO_COLLECTION}`)
        .addEventListener('click', () => downloadFilms(NEW_PROMO_COLLECTION, COLLECTION))
    document.querySelector(`#paramount_${PARAMOUNT_SUBSCRIPTION}`)
        .addEventListener('click', () => downloadFilms(PARAMOUNT_SUBSCRIPTION, SUBSCRIPTION))
    document.querySelector(`#custom_btn`)
        .addEventListener('click', () => {
            downloadFilms(
                document.querySelector(`#custom_element_alias`).value,
                document.querySelector(`#custom_element_type`).value,
            )
        })
}
