class Omok {
    canvas = document.querySelector('#omok');
    ctx = this.canvas.getContext('2d');

    constructor() {
        this.margin = 20;
        this.size = 800;
        this.grid_size = (this.size - 2 * this.margin) / 15;

        this.mouse_x = 0;
        this.mouse_y = 0;

        this.animation_time = 1000;

        this.mouse_state = false;

        this.current_player = 0;

        this.canvas.width = this.size;
        this.canvas.height = this.size;


        this.winner_info = null;
        this.win_animation_time = null;
        this.win_drawing_state = false;

        this.darken_animation_time = null;
        this.darkning_state = 1; // 1 : blur, 0 : none, -1 : unblur

        this.win_line_x_distance = 0;
        this.win_line_y_distance = 1;

        this.omok_board = []

        this.player_labels = [
            document.querySelector('[data-player="0"]'),
            document.querySelector('[data-player="1"]')
        ];

        this.player_name = [
            '플레이어1',
            '플레이어2'
        ]

        this.pause_game = true;

        this.canvas.addEventListener('mousemove', (evt) => {
            if (this.pause_game) return;
            this.getMouseCoord(evt);
        });

        this.canvas.addEventListener('click', (evt) => {
            this.getMouseCoord(evt);
            if (this.omok_board[this.mouse_y][this.mouse_x] !== -1 || !this.mouse_state) return;
            this.omok_board[this.mouse_y][this.mouse_x] = this.current_player;
            this.current_player = +!this.current_player;
            this.changeTurn();
            this.checkWinner();
        });

        document.querySelector('#start-btn').addEventListener('click', this.onStartClicked);

        this.changeResolution(5);
        this.createOmokBoard();
        this.update();

        this.disablePlaying();
    }

    onStartClicked = () => {
        this.player_name = [
            document.querySelector('[data-input-player="0"]').value,
            document.querySelector('[data-input-player="1"]').value
        ];

        this.player_labels.map((element, idx) => {
            element.querySelector('.name').textContent = this.player_name[idx]
        });

        this.enablePlaying();

        document.querySelector('.name-input').classList.add('transparent');

        setTimeout(() => document.querySelector('.name-input-wrapper').style.display = 'none', 1000);
    }

    disablePlaying = () => {
        this.darkning_state = 1;
        this.blur();
        this.mouse_state = false;
        this.pause_game = true;
    }

    enablePlaying = () => {
        this.darkning_state = -1;
        this.blur();
        this.mouse_state = true;
        this.pause_game = false;
    }


    blur = () => {
        this.darken_animation_time = new Date();
    }

    blurOmokBoard = () => {
        let time = new Date() - this.darken_animation_time;

        let ratio = this.easing(time / this.animation_time);

        if (time > this.animation_time) ratio = 1;

        this.ctx.fillStyle = `rgba(0, 0, 0, ${ratio * 0.5})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    unBlurOmokBoard = () => {
        let time = new Date() - this.darken_animation_time;

        let ratio = 1 - this.easing(time / this.animation_time);

        if (time > this.animation_time) {
            ratio = 0;
            this.darkning_state = 0;
        }

        this.ctx.fillStyle = `rgba(0, 0, 0, ${ratio * 0.5})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    createOmokBoard = () => {
        for (let i = 0; i < 16; i++) {
            this.omok_board.push([]);
            for (let j = 0; j < 16; j++) {
                this.omok_board[i].push(-1);
            }
        }
    }

    changeResolution = (scale_factor) => {
        this.canvas.width = this.size * scale_factor;
        this.canvas.height = this.size * scale_factor;
        this.ctx.scale(scale_factor, scale_factor);
    }

    drawGrid = () => {
        for (let i = this.margin; i < this.margin + (this.size - 2 * this.margin); i += this.grid_size) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin, i);
            this.ctx.lineTo(this.size - 20, i);
            this.ctx.moveTo(i, this.margin);
            this.ctx.lineTo(i, this.size - 20);
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = '#000';
            this.ctx.stroke();
        }
    }

    drawBall = (x, y, color, stroke) => {
        let realX = 20 + x * this.grid_size;
        let realY = 20 + y * this.grid_size;
        this.ctx.beginPath();
        this.ctx.arc(realX, realY, this.grid_size / 3, 0, 2 * Math.PI);
        stroke && this.ctx.stroke();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    announceWinner = () => {
        this.win_drawing_state = true;
        this.win_animation_time = new Date();

        const looser = this.player_labels[this.current_player];
        looser.classList.remove('turn');
        looser.querySelector('.turn-text').style.display = 'none';

        const winner = this.player_labels[this.winner_info[0]];
        winner.classList.add('win');
        winner.querySelector('.win-text').style.display = '';

        this.win_line_x_distance = this.winner_info[3][0] - this.winner_info[2][0];
        this.win_line_y_distance = this.winner_info[3][1] - this.winner_info[2][1];
    }

    easing = (x) => {
        return 1 - (1 - x) * (1 - x);
    }

    drawWinnerLine = () => {
        this.ctx.beginPath();
        this.ctx.moveTo(20 + this.winner_info[2][0] * this.grid_size, 20 + this.winner_info[2][1] * this.grid_size);

        let time = new Date() - this.win_animation_time;

        let ratio = this.easing(time / this.animation_time);

        if (time > this.animation_time) ratio = 1;

        let delta_x = this.win_line_x_distance * ratio;
        let delta_y = this.win_line_y_distance * ratio;

        this.ctx.lineTo(20 + (this.winner_info[2][0] + delta_x) * this.grid_size, 20 + (this.winner_info[2][1] + delta_y) * this.grid_size);
        this.ctx.lineWidth = this.grid_size / 3;
        this.ctx.strokeStyle = 'rgba(159, 199, 255, 0.7)';
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }

    changeTurn = () => {
        const prevPlayer = this.player_labels[+!this.current_player];
        const player = this.player_labels[this.current_player];
        prevPlayer.classList.remove('turn');
        prevPlayer.querySelector('.turn-text').style.display = 'none';

        player.classList.add('turn');
        player.querySelector('.turn-text').style.display = '';
    }

    getMouseCoord = (evt) => {
        const rect = this.canvas.getBoundingClientRect();
        let x = evt.clientX - rect.left;
        let y = evt.clientY - rect.top;
        this.mouse_x = Math.floor((x - 20 + this.grid_size / 2) / this.grid_size);
        this.mouse_y = Math.floor((y - 20 + this.grid_size / 2) / this.grid_size);

        this.mouse_state = Math.sqrt(Math.pow(20 + this.mouse_x * this.grid_size - x, 2) + Math.pow(20 + this.mouse_y * this.grid_size - y, 2)) < this.grid_size / 2.5;
    }


    update = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = "#f7c22f";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        this.mouse_state && this.drawBall(this.mouse_x, this.mouse_y, this.current_player === 0 ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.6)", false);


        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 16; j++) {
                let player = this.omok_board[i][j];
                if (player === -1) continue;
                this.drawBall(j, i, player === 0 ? '#000' : '#FFF', true);
            }
        }

        if (this.winner_info && this.win_drawing_state) {
            this.drawWinnerLine(this.ctx);
        }

        if (this.darkning_state) {
            if (this.darkning_state === 1)
                this.blurOmokBoard();
            else
                this.unBlurOmokBoard();
        }

        requestAnimationFrame(this.update);
    }

    checkWinner = () => {
        // horizontal

        let current_state = [-1, -1, []]; // player, count, first coord
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 16; j++) {
                let player = this.omok_board[i][j];
                if (player !== -1 && current_state[0] === player) {
                    current_state[1]++;
                    if (current_state[1] >= 5) {
                        this.winner_info = [...current_state, [j, i]];
                        this.announceWinner();
                        return;
                    }
                } else {
                    current_state = [player, 1, [j, i]];
                }
            }
        }

        // vertical

        current_state = [-1, -1];
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 16; j++) {
                let player = this.omok_board[j][i];
                if (player !== -1 && current_state[0] === player) {
                    current_state[1]++;
                    if (current_state[1] >= 5) {
                        this.winner_info = [...current_state, [i, j]];
                        this.announceWinner();
                        return;
                    }
                } else {
                    current_state = [player, 1, [i, j]];
                }
            }
        }

        // diagonal left -> right

        current_state = [-1, -1];
        let coord = [0, 4];

        while (coord[0] !== 15 || coord[1] !== 11) {
            let player = this.omok_board[coord[1]][coord[0]];
            if (player !== -1 && current_state[0] === player) {
                current_state[1]++;
                if (current_state[1] >= 5) {
                    this.winner_info = [...current_state, coord];
                    this.announceWinner();
                    return;
                }
            } else {
                current_state = [player, 1, [...coord]];
            }

            if (coord[0] + coord[1] <= 15) {
                if (coord[0] === 15) {
                    coord = [1, 15];
                    continue;
                }

                else if (coord[1] === 0) {
                    coord[1] = coord[0] + 1;
                    coord[0] = 0;
                    continue;
                }
            } else {
                if (coord[0] === 15) {
                    coord[0] = coord[1] + 1;
                    coord[1] = 15;
                    continue;
                }
            }

            coord[0]++;
            coord[1]--;
        }

        
        // diagonal right -> left

        current_state = [-1, -1];
        coord = [11, 0];

        while (coord[0] !== 4 || coord[1] != 15) {
            let player = this.omok_board[coord[1]][coord[0]];
            if (player !== -1 && current_state[0] === player) {
                current_state[1]++;
                if (current_state[1] >= 5) {
                    this.winner_info = [...current_state, coord];
                    this.announceWinner();
                    return;
                }
            } else {
                current_state = [player, 1, [...coord]];
            }

            if (coord[0] >= coord[1]) {
                if (coord[1] === 15) {
                    coord = [0, 1];
                    continue;
                }

                else if (coord[0] === 15) {
                    coord[0] = 14 - coord[1];
                    coord[1] = 0;
                    continue;
                }
            } else {
                if (coord[1] === 15) {
                    coord[1] = 16 - coord[0];
                    coord[0] = 0;
                    continue;
                }
            }

            coord[0]++;
            coord[1]++;
        }
    }
}

let omok = new Omok();