import React from "react"

class Shape extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            x: this.props.x,
            y: this.props.y,
            w: this.props.shape === "Circle" ? Math.max(this.props.w, this.props.h) : this.props.w,
            h: this.props.shape === "Circle" ? Math.max(this.props.w, this.props.h) : this.props.h,
            layout: false,
            erase: false
        }
        this.handleClick = this.handleClick.bind(this)
        this.handleCanvasDown = this.handleCanvasDown.bind(this)
        this.handleCanvasMove = this.handleCanvasMove.bind(this)
        this.handleCanvasUp = this.handleCanvasUp.bind(this)

        this.isMoving = false
        this.isResizing = false
    }

    componentDidUpdate(prevProps) {
        console.log('click out', this.props.click)
    }

    handleClick(e) {
        e.preventDefault()
        // console.log('click', this.props.earase)
        console.log('click in')
        this.setState({ layout: true, erase: this.props.earase })
        this.props.clickInside(this.props.id)
    }

    handleMouseDown(corner) {
        const self = this
        return function () {
            if (corner === 0) {
                self.isMoving = true
            } else {
                self.isResizing = true
                self.corner = corner
            }
        }
    }

    handleCanvasDown(e) {
        this.startMovingX = e.clientX
        this.startMovingY = e.clientY
        this.objX = this.state.x
        this.objY = this.state.y
        this.objW = this.state.w
        this.objH = this.state.h
    }
    handleCanvasMove(e) {
        let { x, y, w, h } = this.state
        if (this.isResizing) {
            if (this.corner === 1) {
                x = this.objX + (e.clientX - this.startMovingX)
                y = this.objY + (e.clientY - this.startMovingY)
                w = this.objW - (e.clientX - this.startMovingX)
                h = this.objH - (e.clientY - this.startMovingY)
            } else if (this.corner === 2) {
                x = this.objX + (e.clientX - this.startMovingX)
                w = this.objW - (e.clientX - this.startMovingX)
                h = this.objH + (e.clientY - this.startMovingY)
            } else if (this.corner === 3) {
                y = this.objY + (e.clientY - this.startMovingY)
                w = this.objW + (e.clientX - this.startMovingX)
                h = this.objH - (e.clientY - this.startMovingY)
            } else if (this.corner === 4) {
                w = this.objW + (e.clientX - this.startMovingX)
                h = this.objH + (e.clientY - this.startMovingY)
            }
            w = this.props.shape === "Circle" ? Math.max(w, h) : w
            h = this.props.shape === "Circle" ? Math.max(w, h) : h
            this.setState({ x, y, w, h })
        }
        if (this.isMoving) {
            x = this.objX + (e.clientX - this.startMovingX)
            y = this.objY + (e.clientY - this.startMovingY)
            this.setState({ x, y })
        }
    }
    handleCanvasUp() {
        this.isMoving = false
        this.isResizing = false
    }

    render() {
        const { x, y, w, h, layout } = this.state
        const { shape, weight, stroke, fill } = this.props
        console.log('render', this.state.erase)
        const element =
            shape === "Image" ? <image href={this.props.src} x={x} y={y} width={w} height={h} />
                : (shape === "Rectangle" ? <rect x={x} y={y} width={w} height={h} stroke={stroke} stroke-width={weight} fill={fill} />
                    : (shape === "Circle" ? <circle cx={x + w / 2} cy={y + w / 2} r={w / 2} stroke={stroke} stroke-width={weight} fill={fill} />
                        : <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} stroke={stroke} stroke-width={weight} fill={fill} />))

        { if (this.state.erase) return null }
        return (
            <g width={w + 16} height={h + 16} onClick={this.handleClick} onMouseMove={this.handleCanvasMove} onMouseDown={this.handleCanvasDown} onMouseUp={this.handleCanvasUp}>
                {element}
                {layout &&
                    [<rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} stroke='gray' stroke-dasharray="5 5" fill='transparent' onMouseDown={this.handleMouseDown(0)} />,
                    <circle cx={x - 5} cy={y - 5} r="3" fill="gray" onMouseDown={this.handleMouseDown(1)} />,
                    <circle cx={x - 5} cy={y + h + 5} r="3" fill="gray" onMouseDown={this.handleMouseDown(2)} />,
                    <circle cx={x + w + 5} cy={y - 5} r="3" fill="gray" onMouseDown={this.handleMouseDown(3)} />,
                    <circle cx={x + w + 5} cy={y + h + 5} r="3" fill="gray" onMouseDown={this.handleMouseDown(4)} />
                    ]
                }
            </g>
        )
    }
}

export default Shape