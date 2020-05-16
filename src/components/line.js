import React from 'react'
import PropTypes from 'prop-types';

class Line extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            points: this.props.points,
            path: this.props.path,
            arrow: this.props.arrow,
            stroke: this.props.stroke,
            weight: this.props.weight,
            dashed: this.props.dashed,
            corner: this.props.corner,
            shadow: this.props.shadow,
            strong: this.props.strong
        }
        this.handleClick = this.handleClick.bind(this)
        this.handleCanvasMove = this.handleCanvasMove.bind(this)
        this.handleCanvasUp = this.handleCanvasUp.bind(this)
        this.handleMove = this.handleMove.bind(this)
        this.handleMoving = this.handleMoving.bind(this)
        this.handleDoubleClick = this.handleDoubleClick.bind(this)
    }

    componentDidMount() {
        const { points, path } = this.state
        if (path.length > 0)
            return
        path.push(["M"].concat(points[0]))
        path.push(["L"].concat(points[points.length - 1]))

        this.setState({ path })
    }
    handleClick(e) {
        if (e.detail == 2)
            return
        this.setState({ layout: true })
        e.preventDefault()
        e.stopPropagation()
        const { points } = this.state
        let inter = []
        this.state.path.forEach((p, i) => {
            if (i > 0 && !p.includes("a")) {
                inter.push({ id: i - 1, p: [(points[i - 1][0] + points[i][0]) / 2, (points[i - 1][1] + points[i][1]) / 2] });
            }
        })
        this.props.handleAddLineGuid(this.props.id, this.state.points, inter, this, this.handleMove, e)
    }
    handleAddAnchor(e, idx) {
        const self = this
        return function () {
            let { points, path } = self.state
            self.isAdding = true
            self.idx = idx + 1
            self.startMovingX = e.clientX
            self.startMovingY = e.clientY
            points.splice(idx + 1, 0, [(points[idx][0] + points[idx + 1][0]) / 2, (points[idx][1] + points[idx + 1][1]) / 2])
            path.splice(idx + 1, 0, ["L"].concat(points[idx + 1]))
            self.setState({ points, path })
            let inter = []
            path.map((p, i) => {
                if (i > 0 && !p.includes("a")) {
                    inter.push({ id: i - 1, p: [(points[i - 1][0] + points[i][0]) / 2, (points[i - 1][1] + points[i][1]) / 2] })
                }
            })
            self.props.updateLayout(self.props.id, points, inter)
        }
    }
    updateStyle(prop, value) {
        return new Promise((resolve, reject) => {
            this.setState({ [prop]: value }, resolve(1))

        })
    }
    handleMove(idx, e) {
        // const self = this
        // return function (e) {
        this.isAdding = true
        this.idx = idx
        this.startMovingX = e.clientX
        this.startMovingY = e.clientY

        // }
    }
    handleMoving(dw, dh, dx, dy) {
        let { points, path } = this.state
        points.splice(1, 1, [points[1][0] + dx, points[1][1] + dy])
        path.splice(1, 1, ["L"].concat(points[1]))
        this.props.updateLayout(this.props.id, points, [])
        this.setState({ points, path })
    }
    handleCanvasMove(dx, dy, idx) {
        let { points, path } = this.state
        // if (this.isAdding) {
        points.splice(idx, 1, [points[idx][0] + dx, points[idx][1] + dy])
        if (idx === points.length - 1 || idx === 0) {
            path.splice(idx, 1, [idx == 0 ? "M" : "L"].concat(points[idx]))
        } else {
            const piece = path.splice(idx, 2)
            const radius = 10 + 2 * this.props.weight
            if (!piece[0].includes("a") && !piece[1].includes("a")) {
                path.splice(idx, 0, ["L"].concat(points[idx]), piece[1])
            } else {
                if (piece[0][3] === "a") {
                    const ang = Math.atan2(points[idx][1] - points[idx - 1][1], points[idx][0] - points[idx - 1][0]);
                    const interpolate = [(points[idx - 1][0] + points[idx][0]) / 2, (points[idx - 1][1] + points[idx][1]) / 2]
                    path.splice(idx, 0, ["L", interpolate[0] - (radius / 2) * Math.cos(ang), interpolate[1] - (radius / 2) * Math.sin(ang), "a", 10 + this.props.weight, 30, ang * 180 / Math.PI, 0, 1, radius * Math.cos(ang), radius * Math.sin(ang), "L", points[idx][0], points[idx][1]], piece[1])
                }
                if (piece[1][3] === "a") {
                    const ang = Math.atan2(points[idx + 1][1] - points[idx][1], points[idx + 1][0] - points[idx][0]);
                    const interpolate = [(points[idx][0] + points[idx + 1][0]) / 2, (points[idx][1] + points[idx + 1][1]) / 2]
                    path.splice(idx, 0, ["L"].concat(points[idx]), ["L", interpolate[0] - (radius / 2) * Math.cos(ang), interpolate[1] - (radius / 2) * Math.sin(ang), "a", 10 + this.props.weight, 30, ang * 180 / Math.PI, 0, 1, radius * Math.cos(ang), radius * Math.sin(ang), "L", points[idx + 1][0], points[idx + 1][1]])
                }
            }
        }
        // }
        this.setState({ points, path })
        let inter = []
        path.map((p, i) => {
            if (i > 0 && !p.includes("a")) {
                inter.push({ id: i - 1, p: [(points[i - 1][0] + points[i][0]) / 2, (points[i - 1][1] + points[i][1]) / 2] })
            }
        })
        this.props.updateLayout(this.props.id, points, inter)
    }
    handleCanvasUp() {
        this.isAdding = false
    }
    addBridge(idx) {
        const self = this
        return function () {
            let { points, path } = self.state
            const radius = 10 + 2 * self.props.weight
            const ang = Math.atan2(points[idx + 1][1] - points[idx][1], points[idx + 1][0] - points[idx][0]);
            points.splice(idx + 1, 0, [points[idx][0] + ((points[idx + 1][0] - points[idx][0]) / 3), points[idx][1] + ((points[idx + 1][1] - points[idx][1]) / 3)], [points[idx][0] + ((points[idx + 1][0] - points[idx][0]) * 2 / 3), points[idx][1] + ((points[idx + 1][1] - points[idx][1]) * 2 / 3)])
            const interpolate = [(points[idx + 1][0] + points[idx + 2][0]) / 2, (points[idx + 1][1] + points[idx + 2][1]) / 2]
            path.splice(idx + 1, 1, ["L", points[idx + 1][0], points[idx + 1][1]], ["L", interpolate[0] - (radius / 2) * Math.cos(ang), interpolate[1] - (radius / 2) * Math.sin(ang), "a", 10 + self.props.weight, 30, ang * 180 / Math.PI, 0, 1, radius * Math.cos(ang), radius * Math.sin(ang), "L", points[idx + 2][0], points[idx + 2][1]], ["L", points[idx + 3][0], points[idx + 3][1]])
            self.setState({ points, path })
            let inter = []
            path.map((p, i) => {
                if (i > 0 && !p.includes("a")) {
                    inter.push({ id: i - 1, p: [(points[i - 1][0] + points[i][0]) / 2, (points[i - 1][1] + points[i][1]) / 2] })
                }
            })
            self.props.updateLayout(self.props.id, points, inter)
        }
    }
    handleLogic(logic) {
        this.logic = logic
        console.log(this.logic)
    }
    handleDoubleClick(e) {
        console.log(('double cliked'), e.detail)
        this.props.addLogic(this.props.id, this.logic)
    }
    handleRightClick(e) {
        console.log('right clikc')
        e.preventDefault()
    }
    render() {
        const { points, layout, path } = this.state
        const { arrow, stroke, weight, dashed, corner, shadow, strong } = this.state

        const logic = this.logic
        let inter = []
        const angle = Math.atan2(points[points.length - 1][1] - points[points.length - 2][1], points[points.length - 1][0] - points[points.length - 2][0])
        return (
            <g
                element='Line' props={JSON.stringify(this.state)}
                onClick={this.handleClick}
                onDoubleClick={this.handleDoubleClick}
                onContextMenu={this.handleRightClick}
                //  onMouseMove={this.handleCanvasMove} 
                onMouseDown={this.handleCanvasDown} onMouseUp={this.handleCanvasUp}>
                <filter id="shadow" x="-50%" y="-50%" height="200%" width="200%">
                    <feOffset dx="0" dy="0" result="offsetblur" />
                    <feGaussianBlur in="SourceAlpha" stdDeviation={strong} />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="2" />
                    </feComponentTransfer>
                    <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                </filter>
                <path d={path.map((p, i) => {
                    let round = []
                    if (i > 0 && !p.includes("a")) {
                        inter.push({ id: i - 1, p: [(points[i - 1][0] + points[i][0]) / 2, (points[i - 1][1] + points[i][1]) / 2] });
                    }
                    let tmp = [...p]
                    if (corner == "round" && i > 0 && i < path.length - 1) {
                        const ang1 = Math.atan2(points[i][1] - points[i - 1][1], points[i][0] - points[i - 1][0])
                        const ang2 = Math.atan2(points[i + 1][1] - points[i][1], points[i + 1][0] - points[i][0])
                        round = ["Q", points[i][0], points[i][1], points[i][0] + 10 * Math.cos(ang2), points[i][1] + 10 * Math.sin(ang2)]
                        tmp.splice(p.length - 2, 2, p[p.length - 2] - 10 * Math.cos(ang1), p[p.length - 1] - 10 * Math.sin(ang1))
                    }
                    return tmp.concat(round).join(" ")
                }).join(" ")}
                    fill="none" stroke="var(--logic, black)" stroke-width={weight} strokeLinecap="round" strokeLinejoin="round"
                    stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`}
                    filter={shadow ? "url(#shadow)" : ""} />
                {arrow && <path d={`M${points[points.length - 1].join(" ")} L${points[points.length - 1][0] - 7 * Math.cos(angle - Math.PI / 8)} ${points[points.length - 1][1] - 7 * Math.sin(angle - Math.PI / 8)} L${points[points.length - 1][0] - 7 * Math.cos(angle + Math.PI / 8)} ${points[points.length - 1][1] - 7 * Math.sin(angle + Math.PI / 8)} Z`} fill={stroke} stroke={stroke} stroke-width={weight} />}
            </g>
        )
    }
}

export default Line

Line.defaultProps = {
    path: []
}
Line.PropTypes = {
    points: PropTypes.object.isRequired,
    path: PropTypes.object
}