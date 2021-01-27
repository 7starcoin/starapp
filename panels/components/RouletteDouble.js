import React from 'react';
import PropTypes from 'prop-types';

import './Roulette.scss';


class RouletteDouble extends React.Component {

    isReady = true;

    constructor(props) {
        super(props);
        this.state = {
            spinAngleStart: 0,
            startAngle: 0,
            spinTime: 0,
            arc: Math.PI / (1000 / 2),
        }
        this.spinTimer = null;
        this.spin = this.spin.bind(this);
        this.rotate = this.rotate.bind(this);
    }

    static propTypes = {
        className: PropTypes.string,
        options: PropTypes.array,
        spinAngleStart: PropTypes.number,
        spinTimeTotal: PropTypes.number,
        onComplete: PropTypes.func,
    };

    static defaultProps = {
        options: [],
        spinAngleStart: 50,
        spinTimeTotal: 10000,
    };

    enabledDraw = false;

    componentDidMount() {
        const canvas = this.refs.canvas;
        canvas.width = 300 * window.devicePixelRatio;
        canvas.height = 300 * window.devicePixelRatio;

        this.enabledDraw = true;
        this.drawRouletteWheel();
    }

    byte2Hex(n) {
        const nybHexString = '0123456789ABCDEF';
        return String(nybHexString.substr((n >> 4) & 0x0F, 1)) + nybHexString.substr(n & 0x0F, 1);
    }

    RGB2Color(r, g, b) {
        return '#' + this.byte2Hex(r) + this.byte2Hex(g) + this.byte2Hex(b);
    }

    getColor(item, maxitem) {
        const phase = 0;
        const center = 128;
        const width = 128;
        const frequency = Math.PI * 2 / maxitem;

        const red = Math.sin(frequency * item + 2 + phase) * width + center;
        const green = Math.sin(frequency * item + 0 + phase) * width + center;
        const blue = Math.sin(frequency * item + 4 + phase) * width + center;

        return this.RGB2Color(red, green, blue);
    }

    drawRouletteWheel() {
        const {options} = this.props;
        let {startAngle, arc} = this.state;


        // const spinTimeout = null;
        // const spinTime = 0;
        // const spinTimeTotal = 0;

        let ctx;
        const baseSize = 150 * window.devicePixelRatio;

        const canvas = this.refs.canvas;
        if (canvas.getContext) {
            const outsideRadius = baseSize - baseSize * 0.1;
            const textRadius = baseSize - 45;
            const insideRadius = baseSize - baseSize * 0.2;

            ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;

            ctx.font = '14px Helvetica, Arial';

            let skip = 0;
            for (let i = 0; i < options.length; i++) {
                const angle = startAngle + arc * skip;

                switch (options[i]) {
                    case 0:
                        ctx.fillStyle = '#2196F3';
                        break;
                    case 1:
                        ctx.fillStyle = '#FFC107';
                        break;
                    case 2:
                        ctx.fillStyle = '#FF5722';
                        break;
                    case 3:
                        ctx.fillStyle = '#8BC34A';
                        break;

                }
                const size = 1000 / 54;

                ctx.beginPath();
                ctx.arc(baseSize, baseSize, outsideRadius, angle, angle + arc * size, false);
                ctx.arc(baseSize, baseSize, insideRadius, angle + arc * size, angle, true);
                ctx.fill();

                ctx.save();
                ctx.restore();
                skip += size;
            }
            // const text = (startAngle * 180 / Math.PI + 90) % 360;
            // ctx.fillText(text, baseSize - ctx.measureText(text).width / 2, 80 + baseSize / 3);
            //Arrow
            ctx.strokeStyle = '#EEEEEE';
            ctx.lineWidth = 1;

            ctx.beginPath();
            let dsc = baseSize * 0.05;
            ctx.lineWidth = dsc / 3;
            ctx.moveTo(baseSize, dsc / 2 + baseSize - (outsideRadius - dsc / 2) - 40);
            ctx.lineTo(baseSize, dsc / 2 + baseSize - (outsideRadius - dsc / 2) + 40);
            ctx.stroke();
        }
    }

    spin() {
        this.spinTimer = null;
        this.setState({spinTime: 0}, () => this.rotate());
    }

    rotate() {
        const {spinAngleStart, spinTimeTotal} = this.props;
        if (this.state.spinTime > 10000) {
            clearTimeout(this.spinTimer);
            this.stopRotateWheel();
        } else {
            const spinAngle = this.easeOut(this.state.spinTime, 0, spinAngleStart, spinTimeTotal);
            this.setState({
                startAngle: spinAngle * Math.PI / 180,
                spinTime: this.state.spinTime + 15,
            }, () => {
                this.drawRouletteWheel();
                clearTimeout(this.spinTimer);
                this.spinTimer = setTimeout(() => this.rotate(), 15);
            })
        }
    }

    stopRotateWheel() {
        //this.props.onComplete();
    }

    easeOut(t, b, c, d) {
        const ts = (t /= d) * t;
        const tc = ts * t;
        return b + c * (tc + -3 * ts + 3 * t);
    }

    render() {
        if (this.isReady && this.props.start) {
            this.isReady = false;
            this.spin();
        }
        if (this.enabledDraw) {
            this.drawRouletteWheel();
        }

        return (
            <div className="RouletteFortune">
                <div className="roulette-container">
                    <canvas ref="canvas" width={300} height={300} className="roulette-canvas"/>
                </div>
            </div>
        );
    }
}

export default RouletteDouble;
