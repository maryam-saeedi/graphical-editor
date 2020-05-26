import React from "react"

class Shape extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            x: this.props.x,
            y: this.props.y,
            w: this.props.shape === "Circle" ? Math.max(this.props.w, this.props.h) : this.props.w,
            h: this.props.shape === "Circle" ? Math.max(this.props.w, this.props.h) : this.props.h,
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
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.move = this.move.bind(this)
        this.corner = 0
    }

    componentDidMount() {
        if(this.props.shape !== "Image")
        return 
        var reader = new FileReader();
        const self = this
        reader.onloadend = function () {
            const src = reader.result
            self.setState({src})
        }
        reader.readAsDataURL(this.props.file);
    }
    handleClick(e) {
        const { x, y, w, h, layout } = this.state
        e.preventDefault()
        e.stopPropagation()
        this.setState({ layout: true, erase: this.props.earase })
        this.props.clickInside(this.props.id, e.ctrlKey)
    }

    updateStyle(prop, value) {
        console.log('update style')
        return new Promise((resolve, reject) => {
            this.setState({ [prop]: value }, () => { console.log(this.state); resolve(1) })

        })
    }
    getLocation() {
        return { x: this.state.x, y: this.state.y, w: this.state.w, h: this.state.h }
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
        this.setState({ x: this.state.x + dx, y: this.state.y + dy, w: this.state.w + dw, h: this.state.h + dh })
    }

    handleKeyDown(e) {
        console.log(this.props.id, e.keyCode)
    }
    move(movementX, movementY) {
        let dx = 0, dy = 0, dw = 0, dh = 0
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
        this.handleMoving(dx, dy, dw, dh)
        this.props.updateLayout(this.props.id, this.setBoundry(), this.state.w + dw, this.state.h + dh)
        this.isMoving = true
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
        e.stopPropagation()
        !this.isMoving && this.props.deselect(this.props.id)
    }
    setBoundry() {
        const { x, y, w, h } = this.state
        return (
            <g onClick={e => e.stopPropagation()}>
                <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} stroke='gray' stroke-dasharray="5 5" fill='transparent' onMouseDown={this.handleBoundingMouseDown(0)} onClick={this.clickInBoundry} /> ,
                <circle cx={x - 5} cy={y - 5} r="3" fill="gray" onMouseDown={this.handleBoundingMouseDown(1)} /> ,
                <circle cx={x - 5} cy={y + h + 5} r="3" fill="gray" onMouseDown={this.handleBoundingMouseDown(2)} /> ,
                <circle cx={x + w + 5} cy={y - 5} r="3" fill="gray" onMouseDown={this.handleBoundingMouseDown(3)} /> ,
                <circle cx={x + w + 5} cy={y + h + 5} r="3" fill="gray" onMouseDown={this.handleBoundingMouseDown(4)} />
            </g >
        )
    }
    render() {
        const { x, y, w, h } = this.state
        const { shape, weight, stroke, dashed, corner, fill, shadow, strong } = this.state
        const element =
            shape === "Image" ? <image href={this.state.src} x={x} y={y} width={w} height={h} />
                : (shape === "Rectangle" ? (corner == 'round' && w > 10 && h > 10 ? <path d={`M ${x} ${y + 5} q 0 -5 5 -5 h ${w - 10} q 5 0 5 5 v ${h - 10} q 0 5 -5 5 h -${w - 10} q -5 0 -5 -5 Z`} x={x} y={y} width={w} height={h} stroke={stroke} stroke-width={weight} fill={fill} strokeLinecap={corner} strokeLinejoin={corner} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} filter={shadow ? "url(#shadow2)" : ""} />
                    : <rect x={x} y={y} width={w} height={h} stroke={stroke} stroke-width={weight} fill={fill} strokeLinecap='round' strokeLinejoin={corner} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} filter={shadow ? "url(#shadow2)" : ""} />)
                    : (shape === "Circle" ? <circle cx={x + w / 2} cy={y + w / 2} r={w / 2} stroke={stroke} stroke-width={weight} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} fill={fill} filter={shadow ? "url(#shadow2)" : ""} />
                        : <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} stroke={stroke} stroke-width={weight} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} fill={fill} filter={shadow ? "url(#shadow2)" : ""} />))
        { if (this.state.erase) return null }
        return (
            <g onClick={this.handleClick} onKeyDown={this.handleKeyDown} element='Shape' props={JSON.stringify(this.state)}>
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
            </g>
        )
    }
}

export default Shape