import { Controller } from "stimulus"

export default class extends Controller {
    static targets = [ "width", "height", "bombs" ]
    connect() {
        this.resetBoard()
    }

    resetBoard() {
        this.flags  = 0
        this.openCells = 0
        this.gameOver  = false
        this.board = this.loadBoard()
        this.board = this.shuffleBoard(this.board)
        this.draw()
    }

    loadBoard() {
        let counter = 0;
        return Array.from(new Array(this.width)).map(() => {
            return Array.from(new Array(this.height)).map(() => {
                counter += 1;
                return { v: counter <= this.bombs ? 'bomb' : 'unknown'}
            })
        })
    }

    shuffleBoard(arr) {
        for (let i = this.width - 1; i > 0; i--) {
            for (let j = 0; j < this.height; j++) {
                let ri = Math.floor(Math.random() * (i + 1));
                let rj = Math.floor(Math.random() * (j + 1));
                [ arr[i][j], arr[ri][rj] ] = [ arr[ri][rj], arr[i][j] ]
            }
        }
        return arr;
    }

    widthUpdated() {
        if (this.width < 1) this.width = 1
        if (this.bombs > this.width * this.height) this.bombs = this.width * this.height

        this.resetBoard()
    }

    get width() {
        return parseInt(this.widthTarget.value)
    }
    set width(value) {
        this.widthTarget.value = value
    }

    heightUpdated() {
        if (this.height < 1) this.height = 1
        if (this.bombs > this.width * this.height) this.bombs = this.width * this.height

        this.resetBoard()
    }

    get height() {
        return parseInt(this.heightTarget.value)
    }
    set height(value) {
        this.heightTarget.value = value
    }

    bombsUpdated() {
        if (this.bombs < 1) this.bombs = 1
        if (this.bombs > this.width * this.height) this.bombs = this.width * this.height

        this.resetBoard()
    }

    get bombs() {
        return parseInt(this.bombsTarget.value)
    }
    set bombs(value) {
        this.bombsTarget.value = value
    }

    draw() {
        this.element.querySelector('#board').innerHTML = this.boardHtml(this.board)
    }

    boardHtml(data) {
        return `
            <ul class="row">
                ${data.map((row, i) => this.rowHtml(i, row))
                      .join('\n')}
            </ul>`
    }

    rowHtml(n, data) {
        return `
            <ul class="row">
                ${data.map((cell, j) => this.cellHtml(n, j, `cell-${this.cellDisplayType(cell)}`))
                      .join('\n')}
            </ul>`
    }

    cellDisplayType(cell) {
        let type = cell.m || cell.v
        return type === 'bomb' ? 'unknown' : type
    }

    cellHtml(x, y, type) {
        return `
            <li data-action="contextmenu->mine-swipper#markCell click->mine-swipper#openCell" class="cell ${type}" data-pos="${x}, ${y}">
            </li>`
    }

    playAgain() {
        this.resetBoard()
    }

    markCell(event) {
        event.preventDefault()

        if (this.gameOver) return

        const [x, y] = event.target.dataset.pos.split(",").map(e => parseInt(e))

        if ((this.board[x][y].v === 'unknown' || this.board[x][y].v === 'bomb') && this.board[x][y].m === undefined) {
            this.board[x][y].m = 'flag'
            this.flags++
        } else if (this.board[x][y].m === 'flag') {
            this.board[x][y].m = undefined
            this.flags--
        }

        if (this.openCells === this.width * this.height - this.bombs && this.bombs === this.flags) {
            this.gameOver = true;
            setTimeout(()=> { alert("You won!!!"); }, 300);
        }

        this.draw()
    }

    openCell(event) {
        event.preventDefault()

        if (this.gameOver) return

        const [x, y] = event.target.dataset.pos.split(",")
                                               .map(e => parseInt(e))

        if(this.board[x][y].v === 'bomb') {
            this.board.forEach((row, i) =>
                row.forEach((cell, j) => {
                    if (cell.v === 'bomb') cell.v = 'bombed'
                })
            )

            this.board[x][y].v = 'the-bomb'
            this.gameOver = true
        } else if (this.board[x][y].v === 'unknown') {
            this.neigbors(x, y)

            if (this.openCells === this.width * this.height - this.bombs && this.bombs === this.flags) {
                this.gameOver = true;
                setTimeout(()=> { alert("You won!!!"); }, 300);
            }
        }

        this.draw()
    }

    neigbors(x, y) {
        if (this.board[x][y].v !== 'unknown') {
            return
        }

        let count = this.bombsAround(x, y)
        this.board[x][y].v = count
        this.openCells++
        if (count === 0) {
            for (let i = x - 1; i <= x + 1; i++) {
                for (let j = y - 1; j <= y + 1; j++) {
                    if (i >= 0 && j >= 0 && i < this.width && j < this.height) {
                        this.neigbors(i, j)
                    }
                }
            }
        }
    }

    bombsAround(x, y) {
        let count = 0
        for (let i = x - 1; i <= x + 1; i++) {
            for (let j = y - 1; j <= y + 1; j++) {
                if (i >= 0 && j >= 0 && i < this.width && j < this.height && (this.board[i][j].v === 'bomb' || this.board[i][j].v === 'the-bomb')) {
                    count++
                }
            }
        }

        return count
    }
}
