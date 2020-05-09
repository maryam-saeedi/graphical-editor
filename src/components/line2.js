import React from 'react'
import { func } from 'prop-types';
import { inspect } from 'util';
import PopoverAnimationDefault from 'material-ui/Popover/PopoverAnimationDefault';

class Bridge extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            points: this.props.points,
            path: [],
        }
        this.handleClick = this.handleClick.bind(this)
        this.handleCanvasMove = this.handleCanvasMove.bind(this)
        this.handleCanvasUp = this.handleCanvasUp.bind(this)
    }

    componentDidMount() {
        const { points } = this.state
        let path = []
        path.push(["M"].concat(points[0]))
        path.push(["L"].concat(points[points.length - 1]))

        this.setState({ path })
    }
    handleClick(e) {
        this.setState({ layout: true })
    }
    handleAddAnchor(idx) {
        const self = this
        return function (e) {
            let { points, path } = self.state
            self.isAdding = true
            self.idx = idx + 1
            self.startMovingX = e.clientX
            self.startMovingY = e.clientY
            points.splice(idx + 1, 0, [(points[idx][0] + points[idx + 1][0]) / 2, (points[idx][1] + points[idx + 1][1]) / 2])
            path.splice(idx + 1, 0, ["L"].concat(points[idx + 1]))
            self.setState({ points, path })
        }
    }
    handleMove(idx) {
        const self = this
        return function (e) {
            self.isAdding = true
            self.idx = idx
            self.startMovingX = e.clientX
            self.startMovingY = e.clientY

        }
    }
    handleCanvasMove(e) {
        let { points, path } = this.state
        if (this.isAdding) {
            points.splice(this.idx, 1, [e.clientX, e.clientY - 64])
            if (this.idx === points.length - 1 || this.idx === 0) {
                path.splice(this.idx, 1, [this.idx == 0 ? "M" : "L"].concat(points[this.idx]))
            } else {
                const piece = path.splice(this.idx, 2)
                const radius = 10 + 2 * this.props.weight
                if (piece[0][3] === "a") {
                    const ang = Math.atan2(points[this.idx][1] - points[this.idx - 1][1], points[this.idx][0] - points[this.idx - 1][0]);
                    const interpolate = [(points[this.idx - 1][0] + points[this.idx][0]) / 2, (points[this.idx - 1][1] + points[this.idx][1]) / 2]
                    path.splice(this.idx, 0, ["L", interpolate[0] - (radius / 2) * Math.cos(ang), interpolate[1] - (radius / 2) * Math.sin(ang), "a", 10 + this.props.weight, 30, ang * 180 / Math.PI, 0, 1, radius * Math.cos(ang), radius * Math.sin(ang), "L", points[this.idx][0], points[this.idx][1]], piece[1])
                }
                if (piece[1][3] === "a") {
                    const ang = Math.atan2(points[this.idx + 1][1] - points[this.idx][1], points[this.idx + 1][0] - points[this.idx][0]);
                    const interpolate = [(points[this.idx][0] + points[this.idx + 1][0]) / 2, (points[this.idx][1] + points[this.idx + 1][1]) / 2]
                    path.splice(this.idx, 0, ["L"].concat(points[this.idx]), ["L", interpolate[0] - (radius / 2) * Math.cos(ang), interpolate[1] - (radius / 2) * Math.sin(ang), "a", 10 + this.props.weight, 30, ang * 180 / Math.PI, 0, 1, radius * Math.cos(ang), radius * Math.sin(ang), "L", points[this.idx + 1][0], points[this.idx + 1][1]])
                }
            }
        }
        this.setState({ points, path })
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
        }
    }
    render() {
        const { points, layout, path } = this.state
        const { arrow, stroke, weight, dashed } = this.props

        let inter = []
        return (
            <g onClick={this.handleClick} onMouseMove={this.handleCanvasMove} onMouseDown={this.handleCanvasDown} onMouseUp={this.handleCanvasUp}>
                <path d={path.map((p, i) => { if (i > 0 && !p.includes("a")) { inter.push({ id: i - 1, p: [(points[i - 1][0] + points[i][0]) / 2, (points[i - 1][1] + points[i][1]) / 2] }); } return p.join(" ") }).join(" ")} fill="none" stroke={stroke} stroke-width={weight} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} />
                {layout &&
                    [points.map((p, i) =>
                        <circle cx={p[0]} cy={p[1]} r="3" fill="gray" onMouseDown={this.handleMove(i)} />
                    ),
                    inter.map((p, i) =>
                        [<circle cx={p.p[0]} cy={p.p[1]} r="3" fill="lightblue" stroke="gray" onMouseDown={this.handleAddAnchor(p.id)} />,
                        <circle cx={p.p[0]} cy={p.p[1] - 10} r="3" fill="yellow" stroke="gray" onClick={this.addBridge(p.id)} />]
                    )
                    ]
                }
            </g>
        )
    }
}

export default Bridge