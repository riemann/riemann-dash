module Riemann
  class Dash
    helpers do
      include ::Rack::Utils

      alias_method :h, :escape_html

      # Returns a scalar factor from 0.2 to 1, where 0.2 is "on the order of
      # age_scale ago", and 1 is "very recent"
      def age_fraction(time)
        return 1 if time.nil?

        x = 1 - ((Time.now.to_f - time) / Dash.config[:age_scale])
        if x < 0.2
          0.2
        elsif x > 1
          1
        else
          x
        end
      end

      # Finds the longest common prefix of a list of strings.
      # i.e. 'abc, 'ab', 'abdf' => 'ab'
      def longest_common_prefix(strings, prefix = '')
        return strings.first if strings.size <= 1

        first = strings[0][0,1] or return prefix
        tails = strings[1..-1].inject([strings[0][1..-1]]) do |tails, string|
          if string[0,1] != first
            return prefix
          else
            tails << string[1..-1]
          end
        end

        longest_common_prefix(tails, prefix + first)
      end

      # An overview of states
      def state_list(states)
        ul(states.map { |s| state_short s })
      end

      def state_grid(states = Dash.client.query)
        h2('States by Host') +
        table(
          *Event.partition(states, :host).map do |host, states|
            tr(
              th(host, :class => 'host'),
              *Event.sort(states, :service).map do |state|
                state_short state
              end
            )
          end
        )
      end

      # Renders a state as the given HTML tag with a % width corresponding to
      # metric / max.
      def state_bar(s, opts = {})
        opts = {:tag => 'div', :max => 1}.merge opts

        return '' unless s
        x = s.metric

        # Text
        text = case x
        when Float
          '%.2f' % x
        when Integer
          x.to_s
        else
          s.state || '?'
        end

        # Size
        size = case x
               when 0
                 0
               when nil
                 100
               else
                 begin
                   x * 100 / opts[:max]
                 rescue ZeroDivisionError
                   0
                 end
               end
        size = "%.2f" % size

        time = Time.at(s.time).strftime(Dash.config[:strftime])

        tag opts[:tag], h(text), 
          :class => "state #{s.state}", 
          :style => "opacity: #{age_fraction s.time}; width: #{size}%", 
          :title => "#{s.state}\n#{s.description}\n\n(at #{time})"
      end

      # Renders a set of states in a chart. Each row is a given host, each
      # service is a column. Each state is shown as a bar with an inferred
      # maximum for the entire service, so you can readily compare multiple
      # hosts.
      #
      # Takes a a set of states and options:
      #   title: the title of the chart. Inferred to be the longest common
      #          prefix of all services.
      #   maxima: maps each service to the maximum value used to display its
      #           bar.
      #   service_names: maps each service to a friendly name. Default service
      #                  names have common prefixes removed.
      #   hosts: an array of hosts for rows. Default is every host present in
      #          states, sorted.
      #   transpose: Hosts go across, services go down. Enables :global_maxima.
      #   global_maximum: Compute default maxima for services globally,
      #                  instead of a different maximum for each service.
      def state_chart(states, opts = {})
        o = {
          :maxima => {},
          :service_names => {}
        }.merge opts
        if o[:transpose] and not o.include?(:global_maximum)
          o[:global_maximum] = true
        end

        # Get all services
        services = states.map { |s| s.service }.compact.uniq.sort

        # Figure out what name to use for each service.
        prefix = longest_common_prefix services
        service_names = services.inject({}) do |names, service|
          names[service] = service[prefix.length..-1]
          names
        end.merge o[:service_names]

        # Compute maximum for each service
        maxima = if o[:global_maximum]
          max = states.map(&:metric).compact.max
          services.inject({}) do |m, s|
            m[s] = max
            m
          end.merge o[:maxima]
        else
          states.inject(Hash.new(0)) do |m, s|
            if s.metric && !(s.metric.respond_to?(:nan?) && s.metric.nan?)
              m[s.service] = [s.metric, m[s.service]].max
            end
            m
          end.merge o[:maxima]
        end

        # Compute union of all hosts for these states, if no
        # list of hosts explicitly given.
        hosts = o[:hosts] || states.map do |state|
          state.host
        end
        hosts = hosts.uniq.sort { |a, b|
          if !a
            -1
          elsif !b
            1
          else
            a <=> b
          end
        }

        # Construct index
        by = states.inject({}) do |index, s|
          index[[s.host, s.service]] = s
          index
        end

        # Title
        title = o[:title] || prefix.capitalize rescue 'Unknown'

        if o[:transpose]
          h2(title) +
          table(
            tr(
              th,
              *hosts.map do |host|
                th host
              end
            ),
            *services.map do |service|
              tr(
                th(service_names[service]),
                *hosts.map do |host|
                  s = by[[host, service]]
                  td(
                    s ? state_bar(s, :max => maxima[service]) : nil
                  )
                end
              )
            end << {:class => 'chart'} # ruby 1.8.7 this is your fault
          )
        else
          h2(title) +
          table(
            tr(
              th,
              *services.map do |service|
                th service_names[service]
              end
            ),
            *hosts.map do |host|
              tr(
                th(host),
                *services.map do |service|
                  s = by[[host, service]]
                  td(
                    s ? state_bar(s, :max => maxima[service]) : nil
                  )
                end
              )
            end <<
            {:class => 'chart'}
          )
        end
      end

      # Renders a state as a short tag.
      def state_short(s, opts={:tag => 'li'})
        if s
          "<#{opts[:tag]} class=\"state #{s.state}\" style=\"opacity: #{age_fraction s.time}\" title=\"#{h s.description}\">#{h s.host} #{h s.service}</#{opts[:tag]}>"
        else
          "<#{opts[:tag]} class=\"service\"></#{opts[:tag]}>"
        end
      end
      
      # Renders a time to an HTML tag.
      def time(unix)
        t = Time.at(unix)
        "<time datetime=\"#{t.iso8601}\">#{t.strftime(Dash.config[:strftime])}</time>"
      end

      # Renders an HTML tag
      def tag(tag, *a)
        if Hash === a.last
          opts = a.pop
        else
          opts = {}
        end

        attrs = opts.map do |k,v|
          "#{k}=\"#{h v}\""
        end.join ' '

        content = if block_given?
          a << yield
        else
          a
        end.flatten.join("\n")

        s = "<#{tag} #{attrs}>#{content}</#{tag}>"
      end
      
      # Specific tag aliases
      %w(div span h1 h2 h3 h4 h5 h6 ul ol li table th tr td u i b).each do |tag|
        class_eval "def #{tag}(*a, &block)
          tag #{tag.inspect}, *a, &block
        end"
      end
    end 
  end
end
