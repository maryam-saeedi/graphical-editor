import React from "react"

class Shape extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            x: this.props.x,
            y: this.props.y,
            w: this.props.shape === "Circle" ? Math.max(this.props.w, this.props.h) : this.props.w,
            h: this.props.shape === "Circle" ? Math.max(this.props.w, this.props.h) : this.props.h,
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
        this.handleResize = this.handleResize.bind(this)
        this.handleMoving = this.handleMoving.bind(this)
    }

    handleClick(e) {
        const { x, y, w, h, layout } = this.state
        e.preventDefault()
        e.stopPropagation()
        this.setState({ layout: true, erase: this.props.earase })
        this.props.clickInside(this.props.id, this, x, y, w, h)
    }

    updateStyle(prop, value) {
        return new Promise((resolve, reject) => {
            this.setState({ [prop]: value }, resolve(1))

        })
    }
    handleResize(x, y, w, h) {
        this.setState({ x, y, w, h })
    }

    handleMoving(dx, dy, dw = 0, dh = 0) {
        this.setState({ x: this.state.x + dx, y: this.state.y + dy, w: this.state.w + dw, h: this.state.h + dh })
    }
    render() {
        const { x, y, w, h } = this.state
        const { shape, weight, stroke, dashed, corner, fill, shadow, strong } = this.state
        const element =
            shape === "Image" ? <image href={this.props.src} x={x} y={y} width={w} height={h} />
                : (shape === "Rectangle" ? (corner == 'round' && w > 10 && h > 10 ? <path d={`M ${x} ${y + 5} q 0 -5 5 -5 h ${w - 10} q 5 0 5 5 v ${h - 10} q 0 5 -5 5 h -${w - 10} q -5 0 -5 -5 Z`} x={x} y={y} width={w} height={h} stroke={stroke} stroke-width={weight} fill={fill} strokeLinecap={corner} strokeLinejoin={corner} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} filter={shadow ? "url(#shadow2)" : ""} />
                    : <rect x={x} y={y} width={w} height={h} stroke={stroke} stroke-width={weight} fill={fill} strokeLinecap='round' strokeLinejoin={corner} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} filter={shadow ? "url(#shadow2)" : ""} />)
                    : (shape === "Circle" ? <circle cx={x + w / 2} cy={y + w / 2} r={w / 2} stroke={stroke} stroke-width={weight} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} fill={fill} filter={shadow ? "url(#shadow2)" : ""} />
                        : <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} stroke={stroke} stroke-width={weight} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} fill={fill} filter={shadow ? "url(#shadow2)" : ""} />))
        { if (this.state.erase) return null }
        return (
            <g onClick={this.handleClick} >
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