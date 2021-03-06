import React from "react"
import PropTypes from 'prop-types';

class Shape extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            x: this.props.x,
            y: this.props.y,
            w: this.props.shape === "Circle" ? Math.max(this.props.w, this.props.h) : this.props.w,
            h: this.props.shape === "Circle" ? Math.max(this.props.w, this.props.h) : this.props.h,
            rotate: this.props.rotate,
            src: this.props.src,
            shape: this.props.shape,
            weight: this.props.weight,
            stroke: this.props.stroke,
            dashed: this.props.dashed,
            corner: this.props.corner,
            fill: this.props.fill,
            shadow: this.props.shadow,
            strong: this.props.strong
        }
        this.handleClick = this.handleClick.bind(this)
        this.clickInBoundry = this.clickInBoundry.bind(this)
        this.handleResize = this.handleResize.bind(this)
        this.handleMoving = this.handleMoving.bind(this)
        this.setSize = this.setSize.bind(this)
        this.move = this.move.bind(this)
        this.corner = 0
    }

    componentDidMount() {
        if (this.props.shape !== "Image")
            return
        if (this.state.src)
            return
        var reader = new FileReader();
        const self = this
        const { file } = this.props
        reader.onloadend = function () {
            const src = reader.result
            self.setState({ src })
        }
        reader.readAsDataURL(file);
    }
    handleClick(e) {
        e.preventDefault()
        e.stopPropagation()
        this.props.clickInside(this.props.id, e.ctrlKey)
        this.corner = 0
    }

    updateStyle(prop, value) {
        return new Promise((resolve, reject) => {
            this.setState({ [prop]: value }, () => { resolve(1) })
        })
    }
    getStyle() {
        const { stroke, fill, weight, dashed, corner, shadow, strong, w, h } = this.state
        return { stroke, fill, weight, dashed, corner, shadow, strong, width: w, height: h }
    }
    getSize() {
        return { x: this.state.x, y: this.state.y, w: this.state.w, h: this.state.h }
    }
    setSize(prop, value) {
        const { updateLayout, id } = this.props
        const self = this
        return new Promise((resolve, reject) => {
            this.setState({ [prop]: value }, () => { const { w, h } = self.state; updateLayout(id, self.setBoundry(), w, h); resolve(1) })

        })
    }
    setCorner(corner) {
        this.corner = corner
    }
    getCorner() {
        return this.corner
    }
    handleResize(x, y, w, h) {
        this.setState({ x, y, w, h })
    }

    handleAlign(direction, position) {
        switch (direction) {
            case "Up":
                this.setState({ y: position }, () => this.props.updateLayout(this.props.id, this.setBoundry()))
                break
            case "Down":
                this.setState({ y: position - this.state.h }, () => this.props.updateLayout(this.props.id, this.setBoundry()))
                break
            case "Right":
                this.setState({ x: position - this.state.w }, () => this.props.updateLayout(this.props.id, this.setBoundry()))
                break
            case "Left":
                this.setState({ x: position }, () => this.props.updateLayout(this.props.id, this.setBoundry()))
                break
        }
    }
    handleMoving(dx, dy, dw = 0, dh = 0) {
        const { x, y, w, h } = this.state
        return new Promise((resolve, reject) => {
            this.setState({ x: x + dx, y: y + dy, w: w + dw, h: h + dh },
                () => { resolve({ x: x + dx, y: y + dy, w: w + dw, h: h + dh }) })
        })
    }

    move(movementX, movementY) {
        let dx = 0, dy = 0, dw = 0, dh = 0
        const { id, updateLayout } = this.props
        const { w, h } = this.state
        this.isMoving = true
        if (this.corner === 5) {  //rotate
            if (movementY == 0) return
            const { rotate } = this.state
            const r = Math.max(this.state.w / 2, this.state.h / 2)
            const ang = Math.atan2(Math.sqrt(Math.pow(movementX, 2) + Math.pow(movementY, 2)), r)
            this.setState({ rotate: rotate + (-1 * Math.sign(Math.sign((rotate % 360) / 180 - 1) - 0.01) * Math.sign(movementY) * (ang * 180 / Math.PI)) },
                () => this.props.updateLayout(this.props.id, this.setBoundry(), this.state.w + dw, this.state.h + dh))
            return
        }
        if (this.corner === 1) {
            dx = movementX
            dy = movementY
            dw = - movementX
            dh = - movementY
        } else if (this.corner === 2) {
            dx = movementX
            dw = - movementX
            dh = movementY
        } else if (this.corner === 3) {
            dy = movementY
            dw = movementX
            dh = - movementY
        } else if (this.corner === 4) {
            dw = movementX
            dh = movementY
        } else {
            dx = movementX
            dy = movementY
        }
        this.handleMoving(dx, dy, dw, dh).then(rs => updateLayout(id, this.setBoundry(), w + dw, h + dh))
    }
    handleBoundingMouseDown(corner) {
        const { id, handleBoundryClick } = this.props
        // this.corner = 0
        const self = this
        return function (e) {
            self.isMoving = false
            e.stopPropagation()
            self.corner = corner
            handleBoundryClick(id)
        }
    }
    clickInBoundry(e) {
        const { id, deselect } = this.props
        e.stopPropagation()
        !this.isMoving && deselect(id)
    }
    setBoundry() {
        const { x, y, w, h, rotate } = this.state
        return (
            <g onClick={e => e.stopPropagation()} transform-origin={`${x + w / 2}px ${y + h / 2}px`} style={{ transform: `rotate(${rotate}deg)` }}>
                <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} stroke='gray' stroke-dasharray="5 5" fill='transparent' onMouseDown={this.handleBoundingMouseDown(0)} onClick={this.clickInBoundry} /> ,
                {this.props.rotatable && <path d={`M ${x + w / 2 - 5} ${y - 10} A 7 7 0 1 1 ${x + w / 2 + 5} ${y - 10}`} stroke='red' fill='transparent' strokeWidth='2px' onMouseDown={this.handleBoundingMouseDown(5)} />}
                <circle cx={x - 5} cy={y - 5} r="3" fill="gray" onMouseDown={this.handleBoundingMouseDown(1)} /> ,
                <circle cx={x - 5} cy={y + h + 5} r="3" fill="gray" onMouseDown={this.handleBoundingMouseDown(2)} /> ,
                <circle cx={x + w + 5} cy={y - 5} r="3" fill="gray" onMouseDown={this.handleBoundingMouseDown(3)} /> ,
                <circle cx={x + w + 5} cy={y + h + 5} r="3" fill="gray" onMouseDown={this.handleBoundingMouseDown(4)} />
            </g >
        )
    }
    render() {
        const { x, y, w, h, rotate } = this.state
        const { shape, weight, stroke, dashed, corner, fill, shadow, strong } = this.state
        const element =
            shape === "Image" ? <image href={this.state.src} x={x} y={y} width={w} height={h} />
                : (shape === "Rectangle" ? (corner == 'round' && w > 10 && h > 10 ? <path d={`M ${x} ${y + 5} q 0 -5 5 -5 h ${w - 10} q 5 0 5 5 v ${h - 10} q 0 5 -5 5 h -${w - 10} q -5 0 -5 -5 Z`} x={x} y={y} width={w} height={h} stroke={stroke} stroke-width={weight} fill={fill} strokeLinecap={corner} strokeLinejoin={corner} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} filter={shadow ? "url(#shadow2)" : ""} />
                    : <rect x={x} y={y} width={w} height={h} stroke={stroke} stroke-width={weight} fill={fill} strokeLinecap='round' strokeLinejoin={corner} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} filter={shadow ? "url(#shadow2)" : ""} />)
                    : (shape === "Circle" ? <circle cx={x + w / 2} cy={y + w / 2} r={w / 2} stroke={stroke} stroke-width={weight} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} fill={fill} filter={shadow ? "url(#shadow2)" : ""} />
                        : (shape === "Triangle" ? <polygon points={`${x + w / 2},${y} ${x},${y + h} ${x + w},${y + h}`} stroke={stroke} stroke-width={weight} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} fill={fill} filter={shadow ? "url(#shadow2)" : ""} transform-origin={`${x + w / 2}px ${y + h / 2}px`} />
                            : <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} stroke={stroke} stroke-width={weight} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} fill={fill} filter={shadow ? "url(#shadow2)" : ""} />)))
        return (
            <g onClick={this.handleClick} onKeyDown={this.handleKeyDown} element='Shape' props={JSON.stringify(this.state)} transform-origin={`${x + w / 2}px ${y + h / 2}px`} style={{ transform: `rotate(${rotate}deg)` }}>
                <defs>
                    <filter id="shadow2" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation={strong} result="blur" />
                        <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
                        <feFlood flood-color="#FF0000" flood-opacity="1" result="offsetColor" />
                        <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur" />
                        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                    </filter>
                </defs>
                {/* <filter id="shadow2" x="-50%" y="-50%" height="200%" width="200%">
                    <feOffset dx="0" dy="0" result="offsetblur" />
                    <feGaussianBlur in="SourceAlpha" stdDeviation={strong} />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="2" />
                    </feComponentTransfer>
                    <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                </filter> */}
                {element}
            </ g>
        )
    }
}

Shape.defaultProps = {
    rotate: 0,
    src: '',
    weight: 0,
    stroke: 'black',
    fill: 'transparent',
    dashed: 0,
    corner: 'round',
    shadow: false,
    strong: 0
}
Shape.PropTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    w: PropTypes.number.isRequired,
    h: PropTypes.number.isRequired,
    rotate: PropTypes.number,
    src: PropTypes.string,
    shape: PropTypes.string.isRequired,
    weight: PropTypes.number,
    stroke: PropTypes.string,
    fill: PropTypes.string,
    dashed: PropTypes.string,
    corner: PropTypes.string,
    shadow: PropTypes.bool,
    strong: PropTypes.number
}

export default Shape
