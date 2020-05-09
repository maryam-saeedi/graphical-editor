import React from "React"

class Image extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            layout: false
        }
    }


    handleClick() {
        this.setState({ layout: true })
    }
    render() {
        const { x, y } = this.props
        const element = <image href={this.props.src} x={x} y={y} />

        return (
            <g onClick={this.handleClick} onMouseMove={this.handleCanvasMove} onMouseDown={this.handleCanvasDown} onMouseUp={this.handleCanvasUp}>
                {element}
                {/* {layout &&
                    [<rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} stroke='gray' stroke-dasharray="5 5" fill='transparent' onMouseDown={this.handleMouseDown(0)} />,
                    <circle cx={x - 5} cy={y - 5} r="3" fill="gray" onMouseDown={this.handleMouseDown(1)} />,
                    <circle cx={x - 5} cy={y + h + 5} r="3" fill="gray" onMouseDown={this.handleMouseDown(2)} />,
                    <circle cx={x + w + 5} cy={y - 5} r="3" fill="gray" onMouseDown={this.handleMouseDown(3)} />,
                    <circle cx={x + w + 5} cy={y + h + 5} r="3" fill="gray" onMouseDown={this.handleMouseDown(4)} />
                    ]
                } */}
            </g>
        )
    }
}

export default Image